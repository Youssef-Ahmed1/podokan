// middleware/auth.js
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const Shop = require("../model/shop");

exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  let token;
  
  // Check for token in cookies or Authorization header
  if (req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ErrorHandler("Please login to continue", 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    
    // Get user
    const user = await User.findById(decoded.id).select('+password');
    
    if (!user) {
      return next(new ErrorHandler("User not found", 401));
    }

    // Check if token is issued before password change
    if (user.passwordChangedAt && decoded.iat < user.passwordChangedAt.getTime() / 1000) {
      return next(new ErrorHandler("User recently changed password. Please login again", 401));
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Error:', error);
    return next(new ErrorHandler("Authentication failed", 401));
  }
});

exports.isSeller = catchAsyncErrors(async (req, res, next) => {
  let sellerToken;
  
  if (req.cookies.seller_token) {
    sellerToken = req.cookies.seller_token;
  } else if (req.headers.authorization?.startsWith('Bearer')) {
    sellerToken = req.headers.authorization.split(' ')[1];
  }

  if (!sellerToken) {
    return next(new ErrorHandler("Please login as seller", 401));
  }

  try {
    const decoded = jwt.verify(sellerToken, process.env.JWT_SECRET_KEY);
    const seller = await Shop.findById(decoded.id);

    if (!seller) {
      return next(new ErrorHandler("Seller not found", 404));
    }

    if (seller.status !== 'Active') {
      return next(new ErrorHandler("Seller account is not active", 403));
    }

    req.seller = seller;
    next();
  } catch (error) {
    console.error('Seller Auth Error:', error);
    return next(new ErrorHandler("Seller authentication failed", 401));
  }
});

exports.isAdmin = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorHandler("Please login to continue", 401));
    }

    const userRole = req.user.role.toLowerCase();
    const allowedRoles = roles.map(role => role.toLowerCase());

    if (!allowedRoles.includes(userRole)) {
      return next(new ErrorHandler(`Role (${userRole}) is not allowed to access this resource`, 403));
    }

    next();
  };
};