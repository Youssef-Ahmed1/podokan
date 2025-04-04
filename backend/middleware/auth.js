const ErrorHandler = require("../utils/ErrorHandler");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const Shop = require("../model/shop");
const catchAsyncErrors = require("./catchAsyncErrors");
const AuthUtils = require("../utils/authUtils"); // Ensure path is correct

/**
 * Authenticate regular users with token refresh
 */
exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const token = AuthUtils.getTokenFromRequest(req, "user");
  const requestPath = req.originalUrl || req.path;

  if (!token) {
    // Log when no token is found for a route requiring authentication
    // console.warn(`[isAuthenticated Failed - ${requestPath}] No token found.`);
    return next(
      new ErrorHandler("Authentication required - please login", 401)
    );
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      console.warn(
        `[isAuthenticated Failed - ${requestPath}] User not found for token ID: ${decoded.id}`
      );
      res.clearCookie("token", AuthUtils.getCookieOptions());
      return next(
        new ErrorHandler(
          "User associated with token not found, please login again",
          401
        )
      );
    }
    user.role = user.role
      ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
      : "User";
    req.user = user; // ** CRITICAL: Ensure req.user is set **
    next();
  } catch (tokenError) {
    if (tokenError.name === "TokenExpiredError") {
      // console.log(`[isAuthenticated Refresh - ${requestPath}] User token expired, attempting refresh...`);
      const decodedExpired = jwt.decode(token);
      if (decodedExpired && decodedExpired.id) {
        const user = await User.findById(decodedExpired.id).select("-password");
        if (user && typeof user.getJwtToken === "function") {
          const newToken = user.getJwtToken();
          const { cookieOptions } = AuthUtils.generateTokenResponse(user);
          res.cookie("token", newToken, cookieOptions);
          res.set("Authorization", `Bearer ${newToken}`);
          // console.log(`[isAuthenticated Refresh Success - ${requestPath}] Token refreshed for user: ${user._id}`);
          user.role = user.role
            ? user.role.charAt(0).toUpperCase() +
              user.role.slice(1).toLowerCase()
            : "User";
          req.user = user; // ** CRITICAL: Ensure req.user is set after refresh **
          return next();
        } else {
          console.warn(
            `[isAuthenticated Refresh Failed - ${requestPath}] User (${decodedExpired.id}) not found/invalid during refresh.`
          );
          res.clearCookie("token", AuthUtils.getCookieOptions());
          return next(
            new ErrorHandler("Your session is invalid, please login again", 401)
          );
        }
      } else {
        console.warn(
          `[isAuthenticated Refresh Failed - ${requestPath}] Could not decode expired token.`
        );
        res.clearCookie("token", AuthUtils.getCookieOptions());
        return next(
          new ErrorHandler("Your session is invalid, please login again", 401)
        );
      }
    } else if (tokenError.name === "JsonWebTokenError") {
      console.error(
        `[isAuthenticated Failed - ${requestPath}] Invalid token:`,
        tokenError.message
      );
      res.clearCookie("token", AuthUtils.getCookieOptions());
      return next(
        new ErrorHandler(
          "Invalid authentication token, please login again",
          401
        )
      );
    } else {
      console.error(
        `[isAuthenticated Failed - ${requestPath}] Unhandled token error:`,
        tokenError
      );
      res.clearCookie("token", AuthUtils.getCookieOptions());
      return next(
        new ErrorHandler(`Authentication error: ${tokenError.message}`, 401)
      );
    }
  }
});

/**
 * Authenticate sellers with token refresh
 */
exports.isSeller = catchAsyncErrors(async (req, res, next) => {
  const seller_token = AuthUtils.getTokenFromRequest(req, "seller");
  const requestPath = req.originalUrl || req.path;

  if (!seller_token) {
    // console.warn(`[isSeller Failed - ${requestPath}] No seller token found.`);
    return next(new ErrorHandler("Seller authentication required", 401));
  }

  try {
    const decoded = jwt.verify(seller_token, process.env.JWT_SECRET_KEY);
    const seller = await Shop.findById(decoded.id).select("-password");
    if (!seller) {
      console.warn(
        `[isSeller Failed - ${requestPath}] Seller not found for token ID: ${decoded.id}`
      );
      res.clearCookie("seller_token", AuthUtils.getCookieOptions("seller"));
      return next(
        new ErrorHandler("Seller account not found, please login again", 401)
      );
    }
    const sellerStatus = (seller.status || "").toLowerCase();
    if (sellerStatus !== "active" && sellerStatus !== "approved") {
      console.log(
        `[isSeller Denied - ${requestPath}] Seller ${seller._id} status: ${seller.status}`
      );
      return next(
        new ErrorHandler(
          `Seller account is not active or approved (${seller.status})`,
          403
        )
      );
    }
    req.seller = seller;
    next();
  } catch (tokenError) {
    if (tokenError.name === "TokenExpiredError") {
      // console.log(`[isSeller Refresh - ${requestPath}] Seller token expired, attempting refresh...`);
      const decodedExpired = jwt.decode(seller_token);
      if (decodedExpired && decodedExpired.id) {
        const seller = await Shop.findById(decodedExpired.id).select(
          "-password"
        );
        if (seller && typeof seller.getJwtToken === "function") {
          const sellerStatus = (seller.status || "").toLowerCase();
          if (sellerStatus !== "active" && sellerStatus !== "approved") {
            console.log(
              `[isSeller Refresh Denied - ${requestPath}] Seller ${seller._id} status (${seller.status}) prevents refresh.`
            );
            return next(
              new ErrorHandler(
                `Seller account is not active or approved (${seller.status})`,
                403
              )
            );
          }
          const newToken = seller.getJwtToken();
          const { cookieOptions } = AuthUtils.generateTokenResponse(
            seller,
            "seller"
          );
          res.cookie("seller_token", newToken, cookieOptions);
          res.set("Seller-Authorization", `Bearer ${newToken}`);
          // console.log(`[isSeller Refresh Success - ${requestPath}] Token refreshed for seller: ${seller._id}`);
          req.seller = seller;
          return next();
        } else {
          console.warn(
            `[isSeller Refresh Failed - ${requestPath}] Seller (${decodedExpired.id}) not found/invalid during refresh.`
          );
          res.clearCookie("seller_token", AuthUtils.getCookieOptions("seller"));
          return next(
            new ErrorHandler("Invalid seller session, please login again", 401)
          );
        }
      } else {
        console.warn(
          `[isSeller Refresh Failed - ${requestPath}] Could not decode expired seller token.`
        );
        res.clearCookie("seller_token", AuthUtils.getCookieOptions("seller"));
        return next(
          new ErrorHandler("Invalid seller session, please login again", 401)
        );
      }
    } else if (tokenError.name === "JsonWebTokenError") {
      console.error(
        `[isSeller Failed - ${requestPath}] Invalid seller token:`,
        tokenError.message
      );
      res.clearCookie("seller_token", AuthUtils.getCookieOptions("seller"));
      return next(
        new ErrorHandler("Invalid seller token, please login again", 401)
      );
    } else {
      console.error(
        `[isSeller Failed - ${requestPath}] Unhandled token error:`,
        tokenError
      );
      res.clearCookie("seller_token", AuthUtils.getCookieOptions("seller"));
      return next(
        new ErrorHandler(
          `Seller authentication error: ${tokenError.message}`,
          401
        )
      );
    }
  }
});

/**
 * Admin authorization middleware - MUST run AFTER isAuthenticated
 */
exports.isAdmin = catchAsyncErrors(async (req, res, next) => {
  const requestPath = req.originalUrl || req.path;
  // ** CRITICAL CHECK **: This check fails if isAuthenticated didn't run first or failed to set req.user
  if (!req.user) {
    console.error(
      `[isAdmin Failed - ${requestPath}] CRITICAL: req.user not found. Check middleware order.`
    );
    return next(
      new ErrorHandler("Authentication required - please login", 401)
    );
  }
  const userRole = (req.user.role || "").toLowerCase();
  if (userRole !== "admin") {
    console.warn(
      `[isAdmin Denied - ${requestPath}] User ${req.user._id}. Role: ${
        req.user.role || "None"
      }`
    );
    return next(
      new ErrorHandler(`Access denied: Admin privileges required.`, 403)
    );
  }
  next();
});