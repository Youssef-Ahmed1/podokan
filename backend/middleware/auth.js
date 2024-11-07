// middleware/auth.js
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const Shop = require("../model/shop");
const User = require("../model/user");

// Separate token verification into its own middleware
const verifyAuthToken = (req, res, next) => {
  const token = req.cookies?.token || req.headers?.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is missing"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.decoded = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.name === 'TokenExpiredError' ? 
        "Token has expired" : "Invalid token"
    });
  }
};

const verifySellerToken = (req, res, next) => {
  const token = req.cookies?.seller_token || 
                req.headers?.['seller-authorization']?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Seller token is missing"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.decodedSeller = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.name === 'TokenExpiredError' ? 
        "Seller token has expired" : "Invalid seller token"
    });
  }
};

const isAuthenticated = [
  verifyAuthToken,
  catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.decoded.id).select('+role');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    req.user = user;
    next();
  })
];

const isSeller = [
  verifySellerToken,
  catchAsyncErrors(async (req, res, next) => {
    const seller = await Shop.findById(req.decodedSeller.id);
    
    if (!seller) {
      return res.status(401).json({
        success: false,
        message: "Seller not found"
      });
    }

    req.seller = seller;
    next();
  })
];

const isAdmin = [
  isAuthenticated[0],
  isAuthenticated[1],
  (req, res, next) => {
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }
    next();
  }
];

module.exports = {
  isAuthenticated,
  isSeller,
  isAdmin
};