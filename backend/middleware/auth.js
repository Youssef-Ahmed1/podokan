// middleware/auth.js
const ErrorHandler = require("../utils/ErrorHandler");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const Shop = require("../model/shop");
const catchAsyncErrors = require("./catchAsyncErrors");

exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  try {
    const token = req.cookies?.token || 
                 (req.headers.authorization?.startsWith("Bearer") && 
                  req.headers.authorization.split(" ")[1]);

    if (!token) {
      return next(new ErrorHandler("Please login to access this resource", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new ErrorHandler("User not found", 401));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new ErrorHandler("Invalid token", 401));
    }
    if (error.name === "TokenExpiredError") {
      return next(new ErrorHandler("Token expired", 401));
    }
    return next(error);
  }
});

exports.isSeller = catchAsyncErrors(async (req, res, next) => {
  try {
    // Check for seller token in cookies or header
    const seller_token = req.cookies?.seller_token || 
                        (req.headers["seller-authorization"]?.startsWith("Bearer") && 
                         req.headers["seller-authorization"].split(" ")[1]);

    if (!seller_token) {
      return next(new ErrorHandler("Please login as seller", 401));
    }

    // Verify token
    const decoded = jwt.verify(seller_token, process.env.JWT_SECRET_KEY);

    // Find seller
    const seller = await Shop.findById(decoded.id);

    if (!seller) {
      return next(new ErrorHandler("Seller not found", 401));
    }

    // Check if seller is active
    if (seller.status !== "Active") {
      return next(new ErrorHandler("Seller account is not active", 403));
    }

    // Attach seller to request
    req.seller = seller;
    next();

  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new ErrorHandler("Invalid seller token", 401));
    }
    if (error.name === "TokenExpiredError") {
      return next(new ErrorHandler("Seller token expired", 401));
    }
    return next(error);
  }
});

exports.isAdmin = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ErrorHandler("Please login first", 401));
    }

    if (req.user.role !== "Admin") {
      return next(new ErrorHandler("Access denied: Admin only", 403));
    }

    next();
  } catch (error) {
    return next(error);
  }
});