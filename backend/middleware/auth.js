const ErrorHandler = require("../utils/ErrorHandler");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const Shop = require("../model/shop");

// Clean error response helper
const sendAuthError = (res, message, status = 401) => {
  return res.status(status).json({
    success: false,
    message
  });
};

exports.isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies?.token || 
                 (req.headers.authorization?.startsWith('Bearer') ? 
                  req.headers.authorization.split(' ')[1] : null);

    if (!token) {
      return sendAuthError(res, "Please login to continue");
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return sendAuthError(res, "User not found");
      }
      
      next();
    } catch (jwtError) {
      console.error("JWT Verification failed:", jwtError);
      return sendAuthError(res, "Invalid or expired token");
    }
  } catch (error) {
    console.error("Auth error:", error);
    return sendAuthError(res, "Authentication failed");
  }
};

exports.isSeller = async (req, res, next) => {
  try {
    const token = req.cookies?.seller_token || 
                 (req.headers['seller-authorization']?.startsWith('Bearer') ? 
                  req.headers['seller-authorization'].split(' ')[1] : null);

    if (!token) {
      return sendAuthError(res, "Please login as seller to continue");
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      req.seller = await Shop.findById(decoded.id).select('-password');
      
      if (!req.seller) {
        return sendAuthError(res, "Seller not found");
      }
      
      next();
    } catch (jwtError) {
      console.error("Seller JWT Verification failed:", jwtError);
      return sendAuthError(res, "Invalid or expired seller token");
    }
  } catch (error) {
    console.error("Seller auth error:", error);
    return sendAuthError(res, "Seller authentication failed");
  }
};

exports.isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return sendAuthError(res, "Please login first");
    }

    if (req.user.role !== "admin") {
      return sendAuthError(res, "Access denied. Admin only.", 403);
    }

    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    return sendAuthError(res, "Admin authorization failed", 403);
  }
};

// Combined middleware
exports.isAuthenticatedAdmin = [exports.isAuthenticated, exports.isAdmin];