// middleware/auth.js
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const Shop = require("../model/shop");

// User authentication middleware
exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return next(new ErrorHandler("Please login to continue", 401));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return next(new ErrorHandler("User not found", 401));
        }

        next();
    } catch (error) {
        return next(new ErrorHandler("Authentication failed", 401));
    }
});

// Seller authentication middleware
// middleware/auth.js
const isSeller = catchAsyncErrors(async (req, res, next) => {
  try {
      const token = 
          req.cookies.seller_token || 
          req.headers["seller-authorization"]?.split(" ")[1];

      if (!token) {
          return next(new ErrorHandler("Please login as seller", 401));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      
      const seller = await Shop.findById(decoded.id);
      if (!seller) {
          return next(new ErrorHandler("Seller not found", 404));
      }

      req.seller = seller;
      next();
  } catch (error) {
      return next(new ErrorHandler("Authentication failed", 401));
  }
});

// Admin role check middleware
exports.isAdmin = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ErrorHandler("Please login to continue", 401));
        }

        if (!roles.includes(req.user.role)) {
            return next(
                new ErrorHandler(`Role (${req.user.role}) is not allowed to access this resource`, 403)
            );
        }

        next();
    };
};

module.exports = exports;