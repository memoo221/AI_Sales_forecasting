const errorHandler = (err, req, res, next) => {
  console.error(err);

  return res.status(400).json({
    message: err.message || "Internal Server Error",
  });
};

module.exports = errorHandler;
