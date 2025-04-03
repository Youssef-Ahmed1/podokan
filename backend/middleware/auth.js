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

  if (!token) {
    console.warn("isAuthenticated: No token found.");
    return next(
      new ErrorHandler("Authentication required - please login", 401)
    );
  }

  try {
    // Verify the token first
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      console.warn(
        `isAuthenticated: User not found for decoded ID: ${decoded.id}`
      );
      res.clearCookie("token", AuthUtils.getCookieOptions()); // Clear invalid token cookie
      return next(
        new ErrorHandler("User associated with token not found", 401)
      );
    }

    // Normalize role
    user.role = user.role
      ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
      : "User";
    req.user = user;
    next();
  } catch (tokenError) {
    // If verification fails (expired or invalid)
    if (tokenError.name === "TokenExpiredError") {
      console.log("isAuthenticated: User token expired, attempting refresh...");
      const decodedExpired = jwt.decode(token); // Decode payload even if expired

      if (decodedExpired && decodedExpired.id) {
        const user = await User.findById(decodedExpired.id).select("-password");

        // Check if user exists and has the required method (belt-and-suspenders)
        if (user && typeof user.getJwtToken === "function") {
          // Generate and set new token
          const newToken = user.getJwtToken();
          // Get fresh cookie options from AuthUtils
          const { cookieOptions } = AuthUtils.generateTokenResponse(user);

          res.cookie("token", newToken, cookieOptions);
          res.set("Authorization", `Bearer ${newToken}`); // Optionally set header

          console.log(
            "isAuthenticated: User token refreshed successfully for:",
            user._id
          );

          // Proceed with the request using the refreshed user data
          user.role = user.role
            ? user.role.charAt(0).toUpperCase() +
              user.role.slice(1).toLowerCase()
            : "User";
          req.user = user;
          return next();
        } else {
          console.warn(
            `isAuthenticated: User (${decodedExpired.id}) not found or missing getJwtToken during refresh attempt.`
          );
          res.clearCookie("token", AuthUtils.getCookieOptions());
          return next(
            new ErrorHandler("Invalid session, please login again", 401)
          );
        }
      } else {
        console.warn(
          "isAuthenticated: Could not decode expired user token for refresh."
        );
        res.clearCookie("token", AuthUtils.getCookieOptions());
        return next(
          new ErrorHandler("Invalid session, please login again", 401)
        );
      }
    } else if (tokenError.name === "JsonWebTokenError") {
      console.error("isAuthenticated: Invalid user token:", tokenError.message);
      res.clearCookie("token", AuthUtils.getCookieOptions());
      return next(
        new ErrorHandler(
          "Invalid authentication token, please login again",
          401
        )
      );
    } else {
      // Other unexpected errors during verification
      console.error(
        "isAuthenticated: Unhandled token verification error:",
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

  if (!seller_token) {
    console.warn("isSeller: No seller token found.");
    return next(new ErrorHandler("Seller authentication required", 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(seller_token, process.env.JWT_SECRET_KEY);
    const seller = await Shop.findById(decoded.id).select("-password");

    if (!seller) {
      console.warn(`isSeller: Seller not found for decoded ID: ${decoded.id}`);
      res.clearCookie("seller_token", AuthUtils.getCookieOptions("seller"));
      return next(new ErrorHandler("Seller account not found", 401));
    }

    // Check seller status
    const sellerStatus = (seller.status || "").toLowerCase();
    if (sellerStatus !== "active" && sellerStatus !== "approved") {
      console.log(
        `isSeller: Seller ${seller._id} access denied due to status: ${seller.status}`
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
    // Handle expired or invalid token
    if (tokenError.name === "TokenExpiredError") {
      console.log("isSeller: Seller token expired, attempting refresh...");
      const decodedExpired = jwt.decode(seller_token);

      if (decodedExpired && decodedExpired.id) {
        const seller = await Shop.findById(decodedExpired.id).select(
          "-password"
        );

        // Check if seller exists and has the method
        if (seller && typeof seller.getJwtToken === "function") {
          // Check status before refreshing
          const sellerStatus = (seller.status || "").toLowerCase();
          if (sellerStatus !== "active" && sellerStatus !== "approved") {
            console.log(
              `isSeller: Seller ${seller._id} token refresh denied due to status: ${seller.status}`
            );
            return next(
              new ErrorHandler(
                `Seller account is not active or approved (${seller.status})`,
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
          res.set("Seller-Authorization", `Bearer ${newToken}`);

          console.log(
            "isSeller: Seller token refreshed successfully for:",
            seller._id
          );
          req.seller = seller;
          return next();
        } else {
          console.warn(
            `isSeller: Seller (${decodedExpired.id}) not found or missing getJwtToken during refresh attempt.`
          );
          res.clearCookie("seller_token", AuthUtils.getCookieOptions("seller"));
          return next(
            new ErrorHandler("Invalid seller session, please login again", 401)
          );
        }
      } else {
        console.warn(
          "isSeller: Could not decode expired seller token for refresh."
        );
        res.clearCookie("seller_token", AuthUtils.getCookieOptions("seller"));
        return next(
          new ErrorHandler("Invalid seller session, please login again", 401)
        );
      }
    } else if (tokenError.name === "JsonWebTokenError") {
      console.error("isSeller: Invalid seller token:", tokenError.message);
      res.clearCookie("seller_token", AuthUtils.getCookieOptions("seller"));
      return next(
        new ErrorHandler("Invalid seller token, please login again", 401)
      );
    } else {
      console.error(
        "isSeller: Unhandled token verification error:",
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
 * Admin authorization middleware
 */
exports.isAdmin = catchAsyncErrors(async (req, res, next) => {
  // This middleware MUST run AFTER isAuthenticated
  if (!req.user) {
    console.warn(
      "isAdmin: req.user not found. Ensure isAuthenticated runs first."
    );
    return next(
      new ErrorHandler("Authentication required before admin check", 401)
    );
  }

  const userRole = (req.user.role || "").toLowerCase();

  if (userRole !== "admin") {
    return next(
      new ErrorHandler(
        `Access denied: Admin privileges required. Your role: ${
          req.user.role || "None"
        }`,
        403
      )
    );
  }

  next();
});