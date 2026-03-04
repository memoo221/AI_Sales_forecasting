const COLUMN_KEYWORDS = {
  product_name: ["product", "item", "name", "sku", "product name", "item name", "sku name", "product_name", "productname"],
  date: ["date", "month", "period", "time", "transaction date", "order date", "sale date", "sales date"],
  revenue: ["revenue", "sales", "amount", "total", "income", "total sales", "sales amount", "total revenue", "net sales", "gross sales"],
  quantity: ["quantity", "qty", "units", "sold", "units sold", "quantity sold", "volume", "count"],
  category: ["category", "type", "segment", "group", "department", "class", "product category"],
};

const matchColumn = (columns, keywords) => {
  for (const col of columns) {
    const normalized = col.toLowerCase().trim();
    if (keywords.includes(normalized)) return col;
  }
  // partial match fallback
  for (const col of columns) {
    const normalized = col.toLowerCase().trim();
    if (keywords.some((kw) => normalized.includes(kw) || kw.includes(normalized))) return col;
  }
  return null;
};

const analyzeDataset = (columns, rows) => {
  const mapping = {
    product_name: matchColumn(columns, COLUMN_KEYWORDS.product_name),
    date: matchColumn(columns, COLUMN_KEYWORDS.date),
    revenue: matchColumn(columns, COLUMN_KEYWORDS.revenue),
    quantity: matchColumn(columns, COLUMN_KEYWORDS.quantity),
    category: matchColumn(columns, COLUMN_KEYWORDS.category),
  };

  const issues = [];
  const unmatched = columns.filter((c) => !Object.values(mapping).includes(c));
  if (unmatched.length) issues.push(`Unrecognized columns ignored: ${unmatched.join(", ")}`);

  const confidence =
    mapping.product_name && mapping.date && (mapping.revenue || mapping.quantity)
      ? "high"
      : "low";

  return { mapping, issues, confidence };
};

module.exports = { analyzeDataset };
