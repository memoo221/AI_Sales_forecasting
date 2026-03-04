const { z } = require("zod");

const createProductSchema = z.object({
  name: z.string().trim().min(2),
  sku: z.string().optional(),
  category: z.string().optional(),
  price: z.coerce.number().positive().optional(),
});

const updateProductSchema = createProductSchema.partial();

module.exports = {
  createProductSchema,
  updateProductSchema,
};