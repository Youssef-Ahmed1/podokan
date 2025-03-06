const ErrorHandler = require("../utils/ErrorHandler");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const Shop = require("../model/shop");
const catchAsyncErrors = require("./catchAsyncErrors");

/**
 * Extract token from various sources in the request
 * @param {Object} req - Express request object
 * @param {string} tokenName - Name of the token to extract (token or seller_token)
 * @returns {string|null} - The extracted token or null
 */
const extractToken = (req, tokenName = "token") => {
  // From cookies
  if (req.cookies && req.cookies[tokenName]) {
    return req.cookies[tokenName];
  }

  // From Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  // From plain Authorization header
  if (authHeader) {
    return authHeader;
  }

  // From seller-specific header if looking for seller token
  if (tokenName === "seller_token") {
    const sellerAuthHeader = req.headers["seller-authorization"];
    if (sellerAuthHeader && sellerAuthHeader.startsWith("Bearer ")) {
      return sellerAuthHeader.split(" ")[1];
    }
    if (sellerAuthHeader) {
      return sellerAuthHeader;
    }
  }

  return null;
};

/**
 * Set a new auth token as cookie
 * @param {Object} res - Express response object
 * @param {string} tokenName - Name of the token cookie
 * @param {string} token - The JWT token to set
 * @param {number} expiryDays - Days until token expires
 */
const setTokenCookie = (res, tokenName, token, expiryDays = 90) => {
  res.cookie(tokenName, token, {
    expires: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};

/**
 * Authenticate regular users
 */
exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  try {
    const token = extractToken(req, "token");

    if (!token) {
      return next(
        new ErrorHandler("Authentication required - please login", 401)
      );
    }

    console.log("Authentication token found:", token ? "Present" : "Missing");

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new ErrorHandler("User not found or deleted", 401));
      }

      // Normalize role for consistency
      user.role = user.role
        ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
        : "User";

      req.user = user;
      next();
    } catch (tokenError) {
      if (tokenError.name === "TokenExpiredError") {
        // For user tokens, we'll implement token refresh
        const decoded = jwt.decode(token);

        if (decoded && decoded.id) {
          const user = await User.findById(decoded.id).select("-password");

          if (user) {
            // Generate new token
            const newToken = jwt.sign(
              { id: user._id },
              process.env.JWT_SECRET_KEY,
              {
                expiresIn: process.env.JWT_EXPIRES || "90d",
              }
            );

            // Set new token in cookie
            setTokenCookie(res, "token", newToken);

            // Normalize role
            user.role = user.role
              ? user.role.charAt(0).toUpperCase() +
                user.role.slice(1).toLowerCase()
              : "User";

            req.user = user;
            return next();
          }
        }
      }

      // Handle other token errors
      if (tokenError.name === "JsonWebTokenError") {
        return next(new ErrorHandler("Invalid authentication token", 401));
      }

      return next(
        new ErrorHandler(`Authentication error: ${tokenError.message}`, 401)
      );
    }
  } catch (error) {
    console.error("Auth error:", error);
    return next(new ErrorHandler("Authentication failed - server error", 500));
  }
});

/**
 * Authenticate sellers with auto token refresh
 */
exports.isSeller = catchAsyncErrors(async (req, res, next) => {
  try {
    const seller_token = extractToken(req, "seller_token");

    if (!seller_token) {
      return next(new ErrorHandler("Seller authentication required", 401));
    }

    console.log(
      "Seller auth token found:",
      seller_token ? "Present" : "Missing"
    );

    try {
      // Try to verify the token
      const decoded = jwt.verify(seller_token, process.env.JWT_SECRET_KEY);
      const seller = await Shop.findById(decoded.id).select("-password");

      if (!seller) {
        return next(new ErrorHandler("Seller account not found", 401));
      }

      // Status validation with normalization
      const sellerStatus = (seller.status || "").toLowerCase();
      if (sellerStatus !== "active" && sellerStatus !== "approved") {
        return next(new ErrorHandler("Seller account is not active", 403));
      }

      req.seller = seller;
      next();
    } catch (tokenError) {
      // Handle expired token with refresh mechanism
      if (tokenError.name === "TokenExpiredError") {
        try {
          // Get data from expired token
          const decoded = jwt.decode(seller_token);

          if (decoded && decoded.id) {
            // Find seller without validation
            const seller = await Shop.findById(decoded.id).select("-password");

            if (seller) {
              // Check status before refreshing
              const sellerStatus = (seller.status || "").toLowerCase();
              if (sellerStatus !== "active" && sellerStatus !== "approved") {
                return next(
                  new ErrorHandler("Seller account is not active", 403)
                );
              }

              // Generate new token
              const newToken = jwt.sign(
                { id: seller._id },
                process.env.JWT_SECRET_KEY,
                { expiresIn: process.env.JWT_EXPIRES || "90d" }
              );

              // Set the new token in cookie
              setTokenCookie(res, "seller_token", newToken);

              // Attach seller to request
              req.seller = seller;
              return next();
            }
          }
        } catch (refreshError) {
          console.error("Token refresh error:", refreshError);
          return next(new ErrorHandler("Seller token refresh failed", 401));
        }
      }

      // Handle other token errors
      if (tokenError.name === "JsonWebTokenError") {
        return next(new ErrorHandler("Invalid seller token", 401));
      }

      return next(
        new ErrorHandler(
          `Seller authentication error: ${tokenError.message}`,
          401
        )
      );
    }
  } catch (error) {
    console.error("Seller auth error:", error);
    return next(
      new ErrorHandler("Seller authentication failed - server error", 500)
    );
  }
});

/**
 * Admin authorization middleware
 */
exports.isAdmin = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.user) {
      return next(
        new ErrorHandler("Authentication required before admin check", 401)
      );
    }

    // Case-insensitive role check
    const userRole = (req.user.role || "").toLowerCase();

    console.log("Admin auth check:", {
      userId: req.user._id,
      role: req.user.role,
      normalizedRole: userRole,
    });

    if (userRole !== "admin") {
      return next(
        new ErrorHandler("Access denied: Admin privileges required", 403)
      );
    }

    console.log("Admin role check passed for user:", req.user._id);
    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    return next(new ErrorHandler("Admin authorization failed", 500));
  }
});

/**
 * Validate permissions for a specific resource
 * @param {Function} permissionFn - Function that checks if the user has permission
 */
exports.hasPermission = (permissionFn) => {
  return catchAsyncErrors(async (req, res, next) => {
    if (!req.user) {
      return next(new ErrorHandler("Authentication required", 401));
    }

    const hasAccess = await permissionFn(req);

    if (!hasAccess) {
      return next(
        new ErrorHandler(
          "You don't have permission to access this resource",
          403
        )
      );
    }

    next();
  });
};
