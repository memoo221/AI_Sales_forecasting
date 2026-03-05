const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

const triggerForecast = async (companyId, productId = null) => {
  const response = await fetch(`${ML_SERVICE_URL}/forecast/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company_id: companyId, product_id: productId }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ML service error: ${error}`);
  }

  return response.json();
};

const checkHealth = async () => {
  try {
    console.log("Checking ML health at:", `${ML_SERVICE_URL}/health/`);
    const response = await fetch(`${ML_SERVICE_URL}/health/`);
    console.log("ML health status:", response.status);
    return response.ok;
  } catch (err) {
    console.error("ML health check failed:", err.message);
    return false;
  }
};

module.exports = { triggerForecast, checkHealth };
