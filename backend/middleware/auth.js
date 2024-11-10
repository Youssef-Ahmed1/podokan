const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const Shop = require("../model/shop");

exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  try {
    let token = req.cookies.token;

    if (!token && req.headers.authorization) {
      token = req.headers.authorization.replace("Bearer ", "");
    }

    if (!token) {
      return next(new ErrorHandler("Please login to continue", 401));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new ErrorHandler("User not found", 401));
      }

      req.user = user;
      next();
    } catch (jwtError) {
      return next(new ErrorHandler("Invalid token", 401));
    }
  } catch (error) {
    return next(new ErrorHandler("Authentication failed", 401));
  }
});

exports.isSeller = catchAsyncErrors(async (req, res, next) => {
  try {
    let sellerToken = req.cookies.seller_token;

    if (!sellerToken && req.headers['seller-authorization']) {
      sellerToken = req.headers['seller-authorization'].replace("Bearer ", "");
    }

    if (!sellerToken) {
      return next(new ErrorHandler("Please login as seller to continue", 401));
    }

    try {
      const decoded = jwt.verify(sellerToken, process.env.JWT_SECRET_KEY);
      const seller = await Shop.findById(decoded.id);

      if (!seller) {
        return next(new ErrorHandler("Seller not found", 401));
      }

      req.seller = seller;
      next();
    } catch (jwtError) {
      return next(new ErrorHandler("Invalid seller token", 401));
    }
  } catch (error) {
    return next(new ErrorHandler("Seller authentication failed", 401));
  }
});

exports.isAdmin = catchAsyncErrors(async (req, res, next) => {
  if (!req.user) {
    return next(new ErrorHandler("Please login first", 401));
  }

  if (req.user.role !== "admin") {
    return next(new ErrorHandler("Access denied. Admin only.", 403));
  }

  next();
});

// Combined middleware for routes that need both authentication and admin rights
exports.isAuthenticatedAdmin = [exports.isAuthenticated, exports.isAdmin];