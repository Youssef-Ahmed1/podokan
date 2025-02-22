// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const Shop = require("../model/shop");
const ErrorHandler = require("../utils/ErrorHandler");

const tokenVerification = async (token, secret) => {
  try {
    const decoded = jwt.verify(token, secret);
    return decoded.id ? decoded : null;
  } catch (error) {
    return null;
  }
};

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return req.cookies?.token || req.cookies?.seller_token;
};

exports.isAuthenticated = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    
    if (!token) {
      return next(new ErrorHandler("Please login to access this resource", 401));
    }

    const decoded = await tokenVerification(token, process.env.JWT_SECRET_KEY);
    if (!decoded) {
      return next(new ErrorHandler("Invalid token", 401));
    }

    const user = await User.findById(decoded)
      .select('-password')
      .lean();

    if (!user) {
      return next(new ErrorHandler("User not found", 401));
    }

    if (!user.isVerified) {
      return next(new ErrorHandler("Please verify your email", 403));
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
    const token = getTokenFromRequest(req);
    
    if (!token) {
      return next(new ErrorHandler("Please login as seller to continue", 401));
    }

    const decoded = await tokenVerification(token, process.env.JWT_SECRET_KEY);
    if (!decoded) {
      return next(new ErrorHandler("Invalid seller token", 401));
    }

    const seller = await Shop.findById(decoded)
      .select('-password')
      .lean();

    if (!seller) {
      return next(new ErrorHandler("Seller not found", 401));
    }

    if (!seller.isVerified) {
      // Add verification check
      const verificationStatus = await checkSellerVerification(seller._id);
      if (!verificationStatus.verified) {
        return next(new ErrorHandler(verificationStatus.message || "Seller account is not verified", 403));
      }
      
      // Update seller verification status
      await Shop.findByIdAndUpdate(seller._id, { isVerified: true });
      seller.isVerified = true;
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

// Helper function to check seller verification
const checkSellerVerification = async (sellerId) => {
  try {
    const seller = await Shop.findById(sellerId);
    
    if (!seller) {
      return { verified: false, message: "Seller not found" };
    }

    if (!seller.email) {
      return { verified: false, message: "Seller email not provided" };
    }

    // Add any additional verification checks here
    const isEmailVerified = await checkEmailVerification(seller.email);
    
    return {
      verified: isEmailVerified,
      message: isEmailVerified ? "Verified" : "Email not verified"
    };
  } catch (error) {
    console.error("Verification check error:", error);
    return { verified: false, message: "Verification check failed" };
  }
};

// Helper function to check email verification
const checkEmailVerification = async (email) => {
  try {
    // Add your email verification logic here
    // For now, we'll just check if the email exists
    return Boolean(email);
  } catch (error) {
    console.error("Email verification error:", error);
    return false;
  }
};