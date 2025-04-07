// backend/middleware/auth.js
const ErrorHandler = require("../utils/ErrorHandler");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const Shop = require("../model/shop");
const catchAsyncErrors = require("./catchAsyncErrors");
const AuthUtils = require("../utils/authUtils"); // Ensure path is correct

exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const token = AuthUtils.getTokenFromRequest(req, "user"); // Check header first, then cookie
  const requestPath = req.originalUrl || req.path;

  if (!token) {
    // console.warn(`[Auth - isAuthenticated @ ${requestPath}] Failed: No token found.`);
    return next(
      new ErrorHandler("Authentication required. Please log in.", 401)
    );
  }

  try {
    // --- Verify the token ---
    // This will now correctly use the jwt library's verify function
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // --- Find the user ---
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      console.warn(
        `[Auth - isAuthenticated @ ${requestPath}] Failed: User not found for token ID: ${decoded.id}. Clearing token.`
      );
      res.clearCookie("token", AuthUtils.getCookieOptions());
      return next(
        new ErrorHandler(
          "User associated with token not found. Please log in again.",
          401
        )
      );
    }

    // --- Attach user to request ---
    user.role = user.role
      ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
      : "User";
    req.user = user;
    // console.log(`[Auth - isAuthenticated @ ${requestPath}] Success: User ${user._id} (${user.role}) authenticated.`);
    next();
  } catch (tokenError) {
    // --- Handle Token Errors (Expired or Invalid) ---
    if (tokenError.name === "TokenExpiredError") {
      console.log(
        `[Auth - isAuthenticated @ ${requestPath}] Token expired. Attempting refresh...`
      );
      const decodedExpired = jwt.decode(token); // decode still works on strings/objects
      if (decodedExpired && decodedExpired.id) {
        const user = await User.findById(decodedExpired.id).select("-password");
        if (user && typeof user.getJwtToken === "function") {
          const newToken = user.getJwtToken();
          const { cookieOptions } = AuthUtils.generateTokenResponse(
            user,
            "user"
          );
          res.cookie("token", newToken, cookieOptions);
          // res.set("Authorization", `Bearer ${newToken}`); // Optional
          console.log(
            `[Auth - isAuthenticated @ ${requestPath}] Refresh Success: New token set for user ${user._id}.`
          );
          user.role = user.role
            ? user.role.charAt(0).toUpperCase() +
              user.role.slice(1).toLowerCase()
            : "User";
          req.user = user;
          return next();
        } else {
          console.warn(
            `[Auth - isAuthenticated @ ${requestPath}] Refresh Failed: User (${decodedExpired.id}) not found or invalid during refresh attempt. Clearing token.`
          );
          res.clearCookie("token", AuthUtils.getCookieOptions());
          return next(
            new ErrorHandler(
              "Your session has expired and could not be refreshed. Please log in again.",
              401
            )
          );
        }
      } else {
        console.warn(
          `[Auth - isAuthenticated @ ${requestPath}] Refresh Failed: Could not decode the expired token. Clearing token.`
        );
        res.clearCookie("token", AuthUtils.getCookieOptions());
        return next(
          new ErrorHandler("Invalid session state. Please log in again.", 401)
        );
      }
    } else if (tokenError.name === "JsonWebTokenError") {
      console.error(
        `[Auth - isAuthenticated @ ${requestPath}] Failed: Invalid token format or signature: ${tokenError.message}. Clearing token.`
      );
      res.clearCookie("token", AuthUtils.getCookieOptions());
      return next(
        new ErrorHandler(
          "Invalid authentication token. Please log in again.",
          401
        )
      );
    } else {
      console.error(
        `[Auth - isAuthenticated @ ${requestPath}] Failed: Unhandled token verification error:`,
        tokenError
      );
      res.clearCookie("token", AuthUtils.getCookieOptions());
      // Use the actual error message if available
      const message = tokenError.message
        ? `Authentication error: ${tokenError.message}. Please log in again.`
        : "Authentication error. Please log in again.";
      return next(new ErrorHandler(message, 401));
    }
  }
});

/**
 * Authenticates sellers via token (cookie or header).
 * Handles token verification and refresh.
 * Checks seller status (must be 'active' or 'approved').
 * Sets `req.seller` on successful authentication.
 */
exports.isSeller = catchAsyncErrors(async (req, res, next) => {
  const seller_token = AuthUtils.getTokenFromRequest(req, "seller");
  const requestPath = req.originalUrl || req.path;

  if (!seller_token) {
    // console.warn(`[Auth - isSeller @ ${requestPath}] Failed: No seller token found.`);
    return next(
      new ErrorHandler("Seller authentication required. Please log in.", 401)
    );
  }

  try {
    // --- Verify Token ---
    // This will now correctly use the jwt library's verify function
    const decoded = jwt.verify(seller_token, process.env.JWT_SECRET_KEY);

    // --- Find Seller ---
    const seller = await Shop.findById(decoded.id).select("-password");

    if (!seller) {
      console.warn(
        `[Auth - isSeller @ ${requestPath}] Failed: Seller not found for token ID: ${decoded.id}. Clearing token.`
      );
      res.clearCookie("seller_token", AuthUtils.getCookieOptions("seller"));
      return next(
        new ErrorHandler(
          "Seller account associated with token not found. Please log in again.",
          401
        )
      );
    }

    // --- Check Seller Status ---
    const sellerStatus = (seller.status || "").toLowerCase();
    if (!["active", "approved"].includes(sellerStatus)) {
      console.log(
        `[Auth - isSeller @ ${requestPath}] Denied: Seller ${seller._id} status is '${seller.status}'. Required: 'active' or 'approved'.`
      );
      return next(
        new ErrorHandler(
          `Access denied. Your seller account status is currently '${seller.status}'.`,
          403
        )
      );
    }

    // --- Attach seller to request ---
    req.seller = seller;
    // console.log(`[Auth - isSeller @ ${requestPath}] Success: Seller ${seller._id} authenticated.`);
    next();
  } catch (tokenError) {
    // --- Handle Token Errors (Expired or Invalid) ---
    if (tokenError.name === "TokenExpiredError") {
      console.log(
        `[Auth - isSeller @ ${requestPath}] Seller token expired. Attempting refresh...`
      );
      const decodedExpired = jwt.decode(seller_token);
      if (decodedExpired && decodedExpired.id) {
        const seller = await Shop.findById(decodedExpired.id).select(
          "-password"
        );
        if (seller && typeof seller.getJwtToken === "function") {
          const sellerStatus = (seller.status || "").toLowerCase();
          if (!["active", "approved"].includes(sellerStatus)) {
            console.log(
              `[Auth - isSeller @ ${requestPath}] Refresh Denied: Seller ${seller._id} status ('${seller.status}') prevents token refresh.`
            );
            res.clearCookie(
              "seller_token",
              AuthUtils.getCookieOptions("seller")
            );
            return next(
              new ErrorHandler(
                `Cannot refresh session. Seller account status is '${seller.status}'.`,
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
          // res.set("Seller-Authorization", `Bearer ${newToken}`); // Optional
          console.log(
            `[Auth - isSeller @ ${requestPath}] Refresh Success: New token set for seller ${seller._id}.`
          );
          req.seller = seller;
          return next();
        } else {
          console.warn(
            `[Auth - isSeller @ ${requestPath}] Refresh Failed: Seller (${decodedExpired.id}) not found or invalid during refresh attempt. Clearing token.`
          );
          res.clearCookie("seller_token", AuthUtils.getCookieOptions("seller"));
          return next(
            new ErrorHandler(
              "Invalid seller session. Please log in again.",
              401
            )
          );
        }
      } else {
        console.warn(
          `[Auth - isSeller @ ${requestPath}] Refresh Failed: Could not decode the expired seller token. Clearing token.`
        );
        res.clearCookie("seller_token", AuthUtils.getCookieOptions("seller"));
        return next(
          new ErrorHandler(
            "Invalid seller session state. Please log in again.",
            401
          )
        );
      }
    } else if (tokenError.name === "JsonWebTokenError") {
      console.error(
        `[Auth - isSeller @ ${requestPath}] Failed: Invalid seller token format or signature: ${tokenError.message}. Clearing token.`
      );
      res.clearCookie("seller_token", AuthUtils.getCookieOptions("seller"));
      return next(
        new ErrorHandler(
          "Invalid seller authentication token. Please log in again.",
          401
        )
      );
    } else {
      console.error(
        `[Auth - isSeller @ ${requestPath}] Failed: Unhandled seller token verification error:`,
        tokenError
      );
      res.clearCookie("seller_token", AuthUtils.getCookieOptions("seller"));
      // Use the actual error message if available
      const message = tokenError.message
        ? `Seller authentication error: ${tokenError.message}. Please log in again.`
        : "Seller authentication error. Please log in again.";
      return next(new ErrorHandler(message, 401));
    }
  }
});
exports.isAdmin = catchAsyncErrors(async (req, res, next) => {
  const requestPath = req.originalUrl || req.path;

  if (!req.user) {
    console.error(
      `[Auth - isAdmin @ ${requestPath}] CRITICAL FAILURE: req.user object not found. Middleware 'isAuthenticated' might have failed or was not used before 'isAdmin'.`
    );
    return next(
      new ErrorHandler(
        "Authentication failure. Cannot verify admin status.",
        401
      )
    );
  }

  const userRole = (req.user.role || "").toLowerCase();

  if (userRole !== "admin") {
    console.warn(
      `[Auth - isAdmin @ ${requestPath}] Denied: User ${
        req.user._id
      } attempted access. Role: '${
        req.user.role || "None"
      }'. Required: 'Admin'.`
    );
    return next(
      new ErrorHandler(
        "Access Denied: Administrator privileges are required for this resource.",
        403
      )
    );
  }
  // console.log(`[Auth - isAdmin @ ${requestPath}] Success: User ${req.user._id} authorized as Admin.`);
  next();
});
