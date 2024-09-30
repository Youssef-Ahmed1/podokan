const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const Shop = require("../model/shop");

exports.isAuthenticated = catchAsyncErrors(async(req,res,next) => {
    const {token} = req.cookies;
    console.log("Token from cookies:", token); // Add this log
    if(!token){
        return next(new ErrorHandler("Please login to continue", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    req.user = await User.findById(decoded.id);

    next();
});

exports.isSeller = catchAsyncErrors(async (req, res, next) => {
    const { seller_token } = req.cookies;
    console.log("Seller Token:", seller_token);
    
    if (!seller_token) {
      return next(new ErrorHandler("Please login to continue", 401));
    }
  
    try {
      const decoded = jwt.verify(seller_token, process.env.JWT_SECRET_KEY);
      console.log("Decoded Seller:", decoded);
      
      req.seller = await Shop.findById(decoded.id);
      console.log("Seller:", req.seller);
  
      if (!req.seller) {
        return next(new ErrorHandler("Seller not found", 404));
      }
  
      next();
    } catch (error) {
      console.error("Error in isSeller middleware:", error);
      return next(new ErrorHandler("Authentication failed", 401));
    }
  });
exports.isAdmin = (...roles) => {
    return (req, res, next) => {
        console.log("isAdmin middleware called");
        console.log("User:", req.user);
        console.log("Required roles:", roles);

        if (!req.user) {
            return next(new ErrorHandler("User not authenticated", 401));
        }
        if (!roles.map(role => role.toLowerCase()).includes(req.user.role.toLowerCase())) {
            return next(new ErrorHandler(`${req.user.role} cannot access this resource!`, 403));
        }
        next();
    }
}