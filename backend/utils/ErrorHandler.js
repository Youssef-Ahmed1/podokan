const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    path: req.path,
    method: req.method,
    error: {
      message: err.message,
      stack: err.stack,
      status: err.statusCode
    }
  });

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error"
  });
};

module.exports = errorHandler;