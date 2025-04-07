const ErrorHandler = require("../utils/ErrorHandler");
const jwt = "jsonwebtoken";
const User = require("../model/user");
const Shop = require("../model/shop");
const catchAsyncErrors = require("./catchAsyncErrors");
const AuthUtils = require("../utils/authUtils"); // Ensure path is correct

/**
 * Authenticates regular users via token (cookie or header).
 * Handles token verification and refresh.
 * Sets `req.user` on successful authentication.
 */
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // --- Find the user ---
    // Select '-password' to exclude the password hash
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      console.warn(
        `[Auth - isAuthenticated @ ${requestPath}] Failed: User not found for token ID: ${decoded.id}. Clearing token.`
      );
      // Clear the potentially invalid cookie
      res.clearCookie("token", AuthUtils.getCookieOptions());
      return next(
        new ErrorHandler(
          "User associated with token not found. Please log in again.",
          401
        )
      );
    }

    // --- Attach user to request ---
    // Standardize role format (e.g., 'Admin', 'User')
    user.role = user.role
      ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
      : "User";
    req.user = user; // ** CRITICAL: Make user available for subsequent middleware/routes **
    // console.log(`[Auth - isAuthenticated @ ${requestPath}] Success: User ${user._id} (${user.role}) authenticated.`);
    next(); // Proceed to the next middleware/route handler
  } catch (tokenError) {
    // --- Handle Token Errors (Expired or Invalid) ---
    if (tokenError.name === "TokenExpiredError") {
      console.log(
        `[Auth - isAuthenticated @ ${requestPath}] Token expired. Attempting refresh...`
      );
      // Decode expired token to get user ID
      const decodedExpired = jwt.decode(token);
      if (decodedExpired && decodedExpired.id) {
        const user = await User.findById(decodedExpired.id).select("-password");
        // Check if user exists and has the token generation method
        if (user && typeof user.getJwtToken === "function") {
          // Generate a new token
          const newToken = user.getJwtToken();
          const { cookieOptions } = AuthUtils.generateTokenResponse(
            user,
            "user"
          ); // Get new options

          // Set the new token in the cookie and potentially a header for immediate use
          res.cookie("token", newToken, cookieOptions);
          // Optional: Set Authorization header for SPA single-request scenarios after refresh
          // res.set("Authorization", `Bearer ${newToken}`);

          console.log(
            `[Auth - isAuthenticated @ ${requestPath}] Refresh Success: New token set for user ${user._id}.`
          );

          // ** CRITICAL: Attach refreshed user to request **
          user.role = user.role
            ? user.role.charAt(0).toUpperCase() +
              user.role.slice(1).toLowerCase()
            : "User";
          req.user = user;
          return next(); // Continue the request with the refreshed session
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
      // Handle other potential JWT errors
      console.error(
        `[Auth - isAuthenticated @ ${requestPath}] Failed: Unhandled token verification error:`,
        tokenError
      );
      res.clearCookie("token", AuthUtils.getCookieOptions());
      return next(
        new ErrorHandler(
          `Authentication error: ${tokenError.message}. Please log in again.`,
          401
        )
      );
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
  const seller_token = AuthUtils.getTokenFromRequest(req, "seller"); // Check header first, then cookie
  const requestPath = req.originalUrl || req.path;

  if (!seller_token) {
    // console.warn(`[Auth - isSeller @ ${requestPath}] Failed: No seller token found.`);
    return next(
      new ErrorHandler("Seller authentication required. Please log in.", 401)
    );
  }

  try {
    // --- Verify Token ---
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
    // Allow access only if status is explicitly 'Approved' or 'Active' (adjust as needed)
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
    req.seller = seller; // ** CRITICAL: Make seller available **
    // console.log(`[Auth - isSeller @ ${requestPath}] Success: Seller ${seller._id} authenticated.`);
    next(); // Proceed
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
          // ** Re-check status before refreshing **
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

          // Generate and set new token
          const newToken = seller.getJwtToken();
          const { cookieOptions } = AuthUtils.generateTokenResponse(
            seller,
            "seller"
          );
          res.cookie("seller_token", newToken, cookieOptions);
          // Optional: Set header for immediate use
          // res.set("Seller-Authorization", `Bearer ${newToken}`);

          console.log(
            `[Auth - isSeller @ ${requestPath}] Refresh Success: New token set for seller ${seller._id}.`
          );

          // ** CRITICAL: Attach refreshed seller to request **
          req.seller = seller;
          return next(); // Continue request
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
      return next(
        new ErrorHandler(
          `Seller authentication error: ${tokenError.message}. Please log in again.`,
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