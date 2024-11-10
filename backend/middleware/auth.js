const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const Shop = require("../model/shop");
const User = require("../model/user");

const verifyToken = async (token, secretKey) => {
  try {
    return jwt.verify(token, secretKey);
  } catch (error) {
    return null;
  }
};


exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return next(new ErrorHandler("Please login to continue", 401));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    
    // Find user without password
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return next(new ErrorHandler("User not found", 401));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new ErrorHandler("Invalid token", 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new ErrorHandler("Token expired", 401));
    }
    return next(new ErrorHandler("Authentication failed", 401));
  }
});

exports.isSeller = catchAsyncErrors(async (req, res, next) => {
  try {
    const token = req.cookies.seller_token;

    if (!token) {
      return next(new ErrorHandler("Please login as seller to continue", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const seller = await Shop.findById(decoded.id).select('-password');
    
    if (!seller) {
      return next(new ErrorHandler("Seller not found", 401));
    }

    req.seller = seller;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new ErrorHandler("Invalid seller token", 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new ErrorHandler("Seller token expired", 401));
    }
    return next(new ErrorHandler("Seller authentication failed", 401));
  }
});

//.
// Change back to the original format
exports.isAdmin = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return next(new ErrorHandler(`${role} access denied`, 403));
    }
    next();
  };
};

module.exports = exports;