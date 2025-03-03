// middleware/auth.js
const ErrorHandler = require("../utils/ErrorHandler");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const Shop = require("../model/shop");
const catchAsyncErrors = require("./catchAsyncErrors");

exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  try {
    // Extract token with multiple fallbacks
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer") &&
        req.headers.authorization.split(" ")[1]) ||
      req.headers.authorization; // Simple token without Bearer prefix

    if (!token) {
      return next(
        new ErrorHandler("Please login to access this resource", 401)
      );
    }

    console.log("Authentication token found:", token ? "Present" : "Missing");

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new ErrorHandler("User not found", 401));
    }

    // Normalize role for consistency
    user.role = user.role
      ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
      : "User";

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);
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
    // Extract token with more fallbacks
    const seller_token =
      req.cookies?.seller_token ||
      (req.headers["seller-authorization"]?.startsWith("Bearer") &&
        req.headers["seller-authorization"].split(" ")[1]) ||
      req.headers["seller-authorization"] ||
      req.headers.authorization; // Last resort - try regular auth header

    if (!seller_token) {
      return next(new ErrorHandler("Please login as seller", 401));
    }

    console.log(
      "Seller auth token found:",
      seller_token ? "Present" : "Missing"
    );

    // Verify token
    const decoded = jwt.verify(seller_token, process.env.JWT_SECRET_KEY);

    // Find seller and exclude password
    const seller = await Shop.findById(decoded.id).select("-password");

    if (!seller) {
      return next(new ErrorHandler("Seller not found", 401));
    }

    // More lenient status check - normalize status to lowercase
    const sellerStatus = seller.status ? seller.status.toLowerCase() : "";
    if (sellerStatus !== "active" && sellerStatus !== "approved") {
      return next(new ErrorHandler("Seller account is not active", 403));
    }

    // Attach seller to request
    req.seller = seller;
    next();
  } catch (error) {
    console.error("Seller auth error:", error);
    if (error.name === "JsonWebTokenError") {
      return next(new ErrorHandler("Invalid seller token", 401));
    }
    if (error.name === "TokenExpiredError") {
      return next(new ErrorHandler("Seller token expired", 401));
    }
    return next(error);
  }
});

// middleware/auth.js - Updated isAdmin function
exports.isAdmin = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ErrorHandler("Please login first", 401));
    }

    // Make role check case-insensitive
    const userRole = req.user.role ? req.user.role.toLowerCase() : "";

    // Log for debugging
    console.log("Admin auth check:", {
      userId: req.user._id,
      role: req.user.role,
      normalizedRole: userRole,
    });

    if (userRole !== "admin") {
      return next(new ErrorHandler("Access denied: Admin only", 403));
    }

    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    return next(error);
  }
});