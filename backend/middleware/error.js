const ErrorHandler = require("../utils/ErrorHandler");

module.exports = (err, req, res, next) => {
  // Log error details
  console.error('Error:', {
    path: req.path,
    method: req.method,
    error: {
      message: err.message,
      stack: err.stack,
      status: err.statusCode
    }
  });

  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal server Error";

 // Wrong MongoDB ID error
 if (err.name === "CastError") {
  const message = `Resource not found. Invalid: ${err.path}`;
  err = new ErrorHandler(message, 400);
}

// Mongoose duplicate key error
if (err.code === 11000) {
  const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
  err = new ErrorHandler(message, 400);
}

// Wrong JWT error
if (err.name === "JsonWebTokenError") {
  const message = "JSON Web token is invalid. Try Again!!!";
  err = new ErrorHandler(message, 401);
}

// JWT EXPIRE error
if (err.name === "TokenExpiredError") {
  const message = "JSON Web token is expired. Try Again!!!";
  err = new ErrorHandler(message, 401);
}

res.status(err.statusCode).json({
  success: false,
  message: err.message,
});
};
