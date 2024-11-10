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
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new ErrorHandler("Please login to continue", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new ErrorHandler("User not found", 401));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new ErrorHandler("Authentication failed", 401));
  }
});

exports.isSeller = catchAsyncErrors(async (req, res, next) => {
  try {
    const token = req.cookies.seller_token || 
                 req.headers['seller-authorization']?.split(' ')[1];

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