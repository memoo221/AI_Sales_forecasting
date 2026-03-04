const salesService = require("./sales.service");

const uploadSales = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await salesService.ingestSalesFile(
      req.file.buffer,
      req.file.originalname,
      req.user.companyId
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getSales = async (req, res, next) => {
  try {
    const { productId, from, to } = req.query;

    const sales = await salesService.getSales(req.user.companyId, {
      productId,
      from,
      to,
    });

    res.json(sales);
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadSales, getSales };
