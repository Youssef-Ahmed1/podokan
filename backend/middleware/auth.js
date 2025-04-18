// File: backend/middleware/auth.js
const ErrorHandler = require("../utils/ErrorHandler");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose"); // Import mongoose
const User = require("../model/user");
const Shop = require("../model/shop");
const catchAsyncErrors = require("./catchAsyncErrors");
const AuthUtils = require("../utils/authUtils");

exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const token = AuthUtils.getTokenFromRequest(req, "user");
  const requestPath = req.originalUrl || req.path;

  if (!token) {
    return next(new ErrorHandler("Authentication required.", 401));
  }

  try {
    const decoded = AuthUtils.verifyToken(token); // Use utility for verification
    if (!decoded || !decoded.id) {
      console.error(
        `[Auth @ ${requestPath}] Failed: Invalid decoded token payload.`
      );
      res.clearCookie("token", AuthUtils.getCookieOptions());
      return next(new ErrorHandler("Invalid authentication token.", 401));
    }

    if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
      console.error(
        `[Auth @ ${requestPath}] Failed: Decoded ID (${decoded.id}) is not a valid ObjectId format.`
      );
      res.clearCookie("token", AuthUtils.getCookieOptions());
      return next(new ErrorHandler("Invalid user identifier in token.", 401));
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      console.warn(
        `[Auth @ ${requestPath}] Failed: User not found for token ID: ${decoded.id}. Clearing token.`
      );
      res.clearCookie("token", AuthUtils.getCookieOptions());
      return next(new ErrorHandler("User not found.", 401));
    }

    user.role = user.role
      ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
      : "User";

    console.log(
      `[Auth @ ${requestPath}] SUCCESS: req.user populated. ID: ${user._id}, Type: ${user._id?.constructor?.name}, Role: ${user.role}`
    );

    req.user = user;
    next();
  } catch (tokenError) {
    // Error handling moved inside verifyToken, but catch any unexpected errors here
    console.error(
      `[Auth @ ${requestPath}] Unexpected error during authentication:`,
      tokenError
    );
    res.clearCookie("token", AuthUtils.getCookieOptions());
    return next(new ErrorHandler("Authentication error.", 401));
  }
});

exports.isSeller = catchAsyncErrors(async (req, res, next) => {
  const seller_token = AuthUtils.getTokenFromRequest(req, "seller");
  const requestPath = req.originalUrl || req.path;
  if (!seller_token)
    return next(new ErrorHandler("Seller authentication required.", 401));

  try {
    const decoded = AuthUtils.verifyToken(seller_token);
    if (
      !decoded ||
      !decoded.id ||
      !mongoose.Types.ObjectId.isValid(decoded.id)
    ) {
      console.error(
        `[Auth Seller @ ${requestPath}] Failed: Invalid decoded token payload or ID.`
      );
      res.clearCookie("seller_token", AuthUtils.getCookieOptions("seller"));
      return next(
        new ErrorHandler("Invalid seller authentication token.", 401)
      );
    }
    const seller = await Shop.findById(decoded.id).select("-password");
    if (!seller) {
      console.warn(
        `[Auth Seller @ ${requestPath}] Failed: Seller not found: ${decoded.id}.`
      );
      res.clearCookie("seller_token", AuthUtils.getCookieOptions("seller"));
      return next(new ErrorHandler("Seller not found.", 401));
    }
    const sellerStatus = (seller.status || "").toLowerCase();
    if (!["active", "approved"].includes(sellerStatus)) {
      console.log(
        `[Auth Seller @ ${requestPath}] Denied: Seller ${seller._id} status is '${seller.status}'.`
      );
      return next(
        new ErrorHandler(
          `Access denied. Seller status: '${seller.status}'.`,
          403
        )
      );
    }
    req.seller = seller;
    next();
  } catch (tokenError) {
    console.error(
      `[Auth Seller @ ${requestPath}] Unexpected error:`,
      tokenError
    );
    res.clearCookie("seller_token", AuthUtils.getCookieOptions("seller"));
    return next(new ErrorHandler("Seller authentication error.", 401));
  }
});

exports.isAdmin = catchAsyncErrors(async (req, res, next) => {
  const requestPath = req.originalUrl || req.path;
  if (!req.user) {
    console.error(`[Auth Admin @ ${requestPath}] FAIL: req.user missing.`);
    return next(new ErrorHandler("Authentication failure.", 401));
  }
  const userRole = (req.user.role || "").toLowerCase();
  if (userRole !== "admin") {
    console.warn(
      `[Auth Admin @ ${requestPath}] Denied: User ${req.user._id} Role: '${
        req.user.role || "None"
      }'.`
    );
    return next(
      new ErrorHandler("Access Denied: Admin privileges required.", 403)
    );
  }
  next();
});
