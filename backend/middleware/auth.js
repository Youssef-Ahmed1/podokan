const jwt =  require("jsonwebtoken");
const User = require("../model/user");
const Shop = require("../model/shop");

exports.isAuthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please login to continue"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }
    return res.status(401).json({
      success: false,
      message: "Authentication failed"
    });
  }
};

exports.isSeller = async (req, res, next) => {
  try {
    const authHeader = req.headers['seller-authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please login as seller to continue"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const seller = await Shop.findById(decoded.id);

    if (!seller) {
      return res.status(401).json({
        success: false,
        message: "Seller not found"
      });
    }

    req.seller = seller;
    next();
  } catch (error) {
    console.error("Seller auth error:", error);
    return res.status(401).json({
      success: false,
      message: "Seller authentication failed"
    });
  }
};
// middleware/auth.js
exports.isAdmin = async (req, res, next) => {
  try {
    console.log('Auth check - User data:', {
      id: req.user?._id,
      role: req.user?.role,
      email: req.user?.email
    });

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Please login first"
      });
    }

    const isAdmin = req.user.role === 'Admin' || req.user.role === 'admin';
    console.log('Is admin?', isAdmin);

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Admin only"
      });
    }

    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    return res.status(403).json({
      success: false,
      message: "Admin authorization failed"
    });
  }
};

