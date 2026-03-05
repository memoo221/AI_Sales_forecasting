const prisma = require("../../infrastructure/database/prisma");
const { parseFile } = require("../../common/utils/fileParser");
const { analyzeDataset } = require("../../common/utils/columnMapper");
const { triggerForecast, checkHealth } = require("../../common/utils/mlClient");

const ingestSalesFile = async (buffer, originalname, companyId) => {
  // 1. Parse raw rows from file
  const { columns, rows } = parseFile(buffer, originalname);

  if (rows.length === 0) {
    throw new Error("The uploaded file contains no data rows");
  }

  // 2. Map columns using keyword matching
  const { mapping, issues, confidence } = analyzeDataset(columns, rows);
  const { product_name, date, revenue, quantity, category } = mapping;

  if (!product_name) {
    throw new Error("Could not identify a product name column in the file");
  }
  if (!date) {
    throw new Error("Could not identify a date column in the file");
  }
  if (!revenue && !quantity) {
    throw new Error("Could not identify a revenue or quantity column in the file");
  }

  // 3. Load existing products for this company
  const existingProducts = await prisma.product.findMany({
    where: { companyId },
    select: { id: true, name: true },
  });

  const productMap = new Map(
    existingProducts.map((p) => [p.name.toLowerCase().trim(), p.id])
  );

  // 4. Process and insert each row
  let inserted = 0;
  let skipped = 0;
  const productsCreated = [];
  const errors = [];

  for (const row of rows) {
    try {
      const productName = String(row[product_name] ?? "").trim();

      if (!productName) {
        skipped++;
        continue;
      }

      // Auto-create product if it doesn't exist
      if (!productMap.has(productName.toLowerCase())) {
        const categoryValue = category ? String(row[category] ?? "").trim() || null : null;

        const newProduct = await prisma.product.upsert({
          where: { name_companyId: { name: productName, companyId } },
          update: {},
          create: {
            name: productName,
            category: categoryValue,
            companyId,
          },
        });

        productMap.set(productName.toLowerCase(), newProduct.id);
        productsCreated.push(productName);
      }

      const productId = productMap.get(productName.toLowerCase());

      // Normalize date to midnight UTC; use placeholder if missing (ML service will impute)
      let parsedDate = new Date(row[date]);
      if (isNaN(parsedDate.getTime())) {
        issues.push(`Missing date for product "${productName}" — using placeholder 1970-01-01`);
        parsedDate = new Date(0);
      }
      parsedDate.setUTCHours(0, 0, 0, 0);

      // Allow null for missing numerics — ML service handles imputation
      const parsedRevenue = revenue != null && row[revenue] !== "" && row[revenue] != null
        ? parseFloat(row[revenue]) || null
        : null;
      const parsedQuantity = quantity != null && row[quantity] !== "" && row[quantity] != null
        ? parseInt(row[quantity]) || null
        : null;

      await prisma.sale.upsert({
        where: {
          productId_date_companyId: {
            productId,
            date: parsedDate,
            companyId,
          },
        },
        update: {
          revenue: parsedRevenue ?? undefined,
          quantity: parsedQuantity ?? undefined,
        },
        create: {
          productId,
          companyId,
          date: parsedDate,
          revenue: parsedRevenue,
          quantity: parsedQuantity,
        },
      });

      inserted++;
    } catch (err) {
      skipped++;
      errors.push(err.message);
    }
  }

  // 5. Trigger ML forecasting in the background (don't block the upload response)
  const mlAvailable = await checkHealth();
  let forecast = null;
  if (mlAvailable) {
    forecast = await triggerForecast(companyId).catch((err) => {
      console.error("Forecast trigger failed:", err.message);
      return null;
    });
  }

  return {
    total: rows.length,
    inserted,
    skipped,
    productsCreated,
    confidence,
    mapping,
    issues,
    errors: errors.slice(0, 20),
    forecast: forecast ?? { status: "ml service unavailable" },
  };
};

const getSales = async (companyId, { productId, from, to } = {}) => {
  return prisma.sale.findMany({
    where: {
      companyId,
      ...(productId && { productId: parseInt(productId) }),
      ...(from || to
        ? {
            date: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
            },
          }
        : {}),
    },
    include: { product: { select: { name: true, category: true } } },
    orderBy: { date: "desc" },
  });
};

module.exports = { ingestSalesFile, getSales };
