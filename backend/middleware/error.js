const ErrorHandler = require("../utils/ErrorHandler");

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal server error";

    // Wrong MongoDB Id error
    if (err.name === "CastError") {
        const message = `Resource not found. Invalid: ${err.path}`;
        err = new ErrorHandler(message, 400);
    }

    // Duplicate key error
    if (err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
        err = new ErrorHandler(message, 400);
    }

    // Wrong JWT error
    if (err.name === "JsonWebTokenError") {
        const message = `Invalid token, please login again`;
        err = new ErrorHandler(message, 401);
    }

    // JWT expired error
    if (err.name === "TokenExpiredError") {
        const message = `Token expired, please login again`;
        err = new ErrorHandler(message, 401);
    }

    // Mongoose validation error
    if (err.name === "ValidationError") {
        const message = Object.values(err.errors).map(value => value.message);
        err = new ErrorHandler(message.join(', '), 400);
    }

    // File size error
    if (err.name === "MulterError" && err.code === "LIMIT_FILE_SIZE") {
        const message = "File size is too large. Maximum size is 5MB";
        err = new ErrorHandler(message, 400);
    }

    res.status(err.statusCode).json({
        success: false,
        message: err.message,
        ...(process.env.NODE_ENV === "DEVELOPMENT" && {
            error: err,
            stack: err.stack,
        }),
    });
};