const User = require("../model/user");
const Shop = require("../model/shop");
const ErrorHandler = require("../utils/ErrorHandler");
const AuthUtils = require("../utils/authUtils");

exports.isAuthenticated = async (req, res, next) => {
  try {
    const token = AuthUtils.getTokenFromRequest(req);
    
    if (!token) {
      return next(new ErrorHandler("Please login to access this resource", 401));
    }

    const decoded = AuthUtils.verifyToken(token);
    if (!decoded) {
      return next(new ErrorHandler("Invalid token", 401));
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new ErrorHandler("User not found", 401));
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return next(new ErrorHandler("Authentication failed", 500));
  }
};

exports.isSeller = async (req, res, next) => {
  try {
    const token = AuthUtils.getTokenFromRequest(req, 'seller');
    
    if (!token) {
      return next(new ErrorHandler("Please login as seller to continue", 401));
    }

    const decoded = AuthUtils.verifyToken(token);
    if (!decoded) {
      return next(new ErrorHandler("Invalid seller token", 401));
    }

    const seller = await Shop.findById(decoded.id).select('-password');
    if (!seller) {
      return next(new ErrorHandler("Seller not found", 401));
    }

    if (!seller.isVerified) {
      return next(new ErrorHandler("Seller account is not verified", 403));
    }

    req.seller = seller;
    next();
  } catch (error) {
    console.error("Seller auth error:", error);
    return next(new ErrorHandler("Seller authentication failed", 500));
  }
};

exports.isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ErrorHandler("Please login first", 401));
    }

    if (req.user.role?.toLowerCase() !== 'admin') {
      return next(new ErrorHandler("Access denied: Admin only", 403));
    }

    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    return next(new ErrorHandler("Admin authorization failed", 500));
  }
};