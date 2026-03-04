const prisma =require("../../infrastructure/database/prisma");

const createProduct = async (data, companyId) => {
  return prisma.product.create({
    data: {
      ...data,
      companyId,
    },
  });
};

const getProducts = async (companyId, name) => {
  return prisma.product.findMany({
    where: {
      companyId,
      ...(name && {
        name: {
          contains: name,
          mode: "insensitive",
        },
      }),
    },
    orderBy: { createdAt: "desc" },
  });
};

const getProductById = async (id, companyId) => {
  return prisma.product.findFirst({
    where: { id, companyId },
  });
};

const updateProduct = async (id, companyId, data) => {
  const result = await prisma.product.updateMany({
    where: { id, companyId },
    data,
  });

  if (result.count === 0) return null;

  return prisma.product.findFirst({
    where: { id, companyId },
  });
};

const deleteProduct = async (id, companyId) => {
  const result = await prisma.product.deleteMany({
    where: { id, companyId },
  });

  return result.count > 0;
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};