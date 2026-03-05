const Groq = require("groq-sdk");
const prisma = require("../../infrastructure/database/prisma");

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are an AI Sales Intelligence Assistant embedded in a sales analytics platform.
You have access to a company's real sales data, product performance, and ML-generated revenue forecasts.

Your role:
- Analyze sales trends and patterns from the provided data context
- Answer questions about product performance, revenue, and forecasts
- Identify risks (declining products, seasonal drops) and opportunities (growing products, forecast peaks)
- Give concise, actionable recommendations backed by the data
- Always reference specific numbers from the data when making claims

Rules:
- Only answer questions related to the sales data provided
- If data is insufficient to answer a question, say so clearly
- Keep responses focused and business-oriented
- Format numbers as currency where appropriate (e.g. $1,250.00)`;

const buildDataContext = async (companyId) => {
  const sales = await prisma.sale.findMany({
    where: { companyId },
    include: { product: { select: { name: true, category: true } } },
    orderBy: { date: "asc" },
  });

  const forecasts = await prisma.forecast.findMany({
    where: { companyId },
    include: { product: { select: { name: true } } },
    orderBy: { targetDate: "asc" },
  });

  const productSummary = {};

  for (const sale of sales) {
    const name = sale.product.name;
    if (!productSummary[name]) {
      productSummary[name] = {
        category: sale.product.category,
        totalRevenue: 0,
        dataPoints: 0,
        firstDate: sale.date,
        lastDate: sale.date,
      };
    }
    productSummary[name].totalRevenue += sale.revenue ?? 0;
    productSummary[name].dataPoints++;
    productSummary[name].lastDate = sale.date;
  }

  const forecastSummary = {};
  for (const f of forecasts) {
    const name = f.product.name;
    if (!forecastSummary[name]) {
      forecastSummary[name] = { totalPredicted: 0, days: 0 };
    }
    forecastSummary[name].totalPredicted += f.predicted;
    forecastSummary[name].days++;
  }

  const lines = ["=== SALES DATA CONTEXT ===\n"];

  for (const [name, data] of Object.entries(productSummary)) {
    lines.push(`Product: ${name} (${data.category ?? "uncategorized"})`);
    lines.push(`  Historical Revenue: $${data.totalRevenue.toFixed(2)} over ${data.dataPoints} data points`);
    lines.push(`  Period: ${new Date(data.firstDate).toDateString()} → ${new Date(data.lastDate).toDateString()}`);

    if (forecastSummary[name]) {
      const f = forecastSummary[name];
      lines.push(`  Forecast (next ${f.days} days): $${f.totalPredicted.toFixed(2)} predicted revenue`);
    } else {
      lines.push(`  Forecast: no forecast data available`);
    }
    lines.push("");
  }

  return lines.join("\n");
};

const chat = async (companyId, messages) => {
  const dataContext = await buildDataContext(companyId);

  const messagesWithContext = messages.map((msg, index) => {
    if (index === 0 && msg.role === "user") {
      return {
        role: "user",
        content: `${dataContext}\n\nUser question: ${msg.content}`,
      };
    }
    return msg;
  });

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 1024,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...messagesWithContext,
    ],
  });

  return response.choices[0].message.content;
};

module.exports = { chat };
