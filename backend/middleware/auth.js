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


exports.isSeller = catchAsyncErrors(async (req, res, next) => {
  try {
    const token = 
      req.cookies.seller_token ||
      (req.headers["seller-authorization"]?.replace("Bearer ", "")) ||
      (req.headers["authorization"]?.replace("Bearer ", ""));

    if (!token) {
      return next(new ErrorHandler("Please login to continue", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    
    const seller = await Shop.findById(decoded.id)
      .select('+email +role');

    if (!seller) {
      return next(new ErrorHandler("Seller not found", 401));
    }

    req.seller = seller;
    next();
  } catch (error) {
    console.error("Seller auth error:", error);
    return next(new ErrorHandler("Authentication failed", 401));
  }
});

exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  try {
    const token = 
      req.cookies.token ||
      (req.headers.authorization ? 
        req.headers.authorization.replace("Bearer ", "") : null);

    if (!token) {
      return next(new ErrorHandler("Please login to continue", 401));
    }

    const decoded = verifyToken(token, process.env.JWT_SECRET_KEY);
    
    const user = await User.findById(decoded.id)
      .select('+email +role')
      .lean();

    if (!user) {
      return next(new ErrorHandler("User not found", 401));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new ErrorHandler(error.message, 401));
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