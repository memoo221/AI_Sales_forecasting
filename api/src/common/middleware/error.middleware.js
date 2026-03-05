const { ZodError } = require("zod");

const errorHandler = (err, req, res, next) => {
  console.error(err);

    if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      errors: err.issues.map((e) => ({
        field: e.path[0],
        message: e.message,
      })),
    });
  }

  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    message: err.message || "Internal Server Error",
  });
};

module.exports = errorHandler;
