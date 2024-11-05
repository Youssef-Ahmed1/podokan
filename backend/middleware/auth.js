// middleware/auth.js

const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const Shop = require("../model/shop");
const User = require("../model/user");

const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ErrorHandler('Token has expired', 401);
    }
    throw new ErrorHandler('Invalid token', 401);
  }
};



exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];
  
  if (!token) {
    return next(new ErrorHandler("Please login to continue", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return next(new ErrorHandler("Invalid token", 401));
  }
});
exports.isSeller = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies.seller_token || req.headers["seller-authorization"]?.split(" ")[1];

  if (!token) {
    return next(new ErrorHandler("Please login as seller", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.seller = await Shop.findById(decoded.id);
    if (!req.seller) {
      return next(new ErrorHandler("Seller not found", 401));
    }
    next();
  } catch (error) {
    console.error("Seller auth error:", error);
    return next(new ErrorHandler("Invalid seller token", 401));
  }
});
exports.isAdmin = (roles = ['admin']) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ErrorHandler(`Access denied. Role ${roles.join(' or ')} required`, 403));
    }
    next();
  };
};

module.exports = exports;