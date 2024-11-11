const jwt = require("jsonwebtoken");
const User = require("../model/user");
const Shop = require("../model/shop");

exports.isAuthenticated = async (req, res, next) => {
  try {
    let token = req.cookies.token;
    
    // Check Authorization header if no cookie
    const authHeader = req.headers.authorization;
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please login to continue"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({
      success: false,
      message: "Authentication failed"
    });
  }
};

exports.isSeller = async (req, res, next) => {
  try {
    let token = req.cookies.seller_token;
    
    // Check Seller-Authorization header if no cookie
    const authHeader = req.headers['seller-authorization'];
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please login as seller to continue"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.seller = await Shop.findById(decoded.id).select('-password');

    if (!req.seller) {
      return res.status(401).json({
        success: false,
        message: "Seller not found"
      });
    }

    next();
  } catch (error) {
    console.error("Seller auth error:", error);
    return res.status(401).json({
      success: false,
      message: "Seller authentication failed"
    });
  }
};

exports.isAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Admin authorization failed"
    });
  }
};