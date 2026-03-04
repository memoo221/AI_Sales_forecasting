const {
  createProductSchema,
  updateProductSchema,
} = require("./product.validation");

const productService = require("./product.service");

const create = async (req, res, next) => {
  try {
    const data = createProductSchema.parse(req.body);

    const product = await productService.createProduct(
      data,
      req.user.companyId
    );

    res.status(201).json(product);
  } catch (err) {
    return next(err);
  }
};

const getAll = async (req, res, next) => {
  try {
    const { name } = req.query;

    const products = await productService.getProducts(
      req.user.companyId,
      name
    );

    res.json(products);
  } catch (err) {
    return next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await productService.getProductById(
      id,
      req.user.companyId
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    return next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const data = updateProductSchema.parse(req.body);

    const updated = await productService.updateProduct(
      id,
      req.user.companyId,
      data
    );

    if (!updated) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(updated);
  } catch (err) {
    return next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const deleted = await productService.deleteProduct(
      id,
      req.user.companyId
    );

    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(204).send();
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove,
};