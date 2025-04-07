// backend/utils/authUtils.js
const jwt = require("jsonwebtoken");

// Default cookie expiration (e.g., 7 days)
const DEFAULT_COOKIE_EXPIRY_DAYS = parseInt(
  process.env.COOKIE_EXPIRE_DAYS || "7",
  10
);

class AuthUtils {
  /**
   * Generates standard cookie options.
   * @param {string} [type='user'] - Type of token ('user' or 'seller'), currently unused for options but could be.
   * @returns {object} Cookie options object.
   */
  static getCookieOptions(type = "user") {
    const isProduction = process.env.NODE_ENV === "production";
    return {
      expires: new Date(
        Date.now() + DEFAULT_COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
      ),
      httpOnly: true, // ** CRITICAL **: Prevents client-side JavaScript access to the cookie.

      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      // -----------------------------
      path: "/",
    };
  }

  /**
 
   * @param {object} req - Express request object.
   * @param {string} [type='user'] - 'user' or 'seller'. Determines header/cookie names.
   * @returns {string|null} The extracted token or null if not found.
   */
  static getTokenFromRequest(req, type = "user") {
    const headerKey =
      type === "seller" ? "seller-authorization" : "authorization"; // Lowercase header key
    const cookieKey = type === "seller" ? "seller_token" : "token";
    let token = null;

    // 1. Check Authorization Header (Bearer Token)
    const authHeader = req.headers[headerKey];
    if (
      authHeader &&
      typeof authHeader === "string" &&
      authHeader.startsWith("Bearer ")
    ) {
      token = authHeader.split(" ")[1];
      // Basic check to ensure token seems valid (not "null" or "undefined" string)
      if (token && token !== "null" && token !== "undefined") {
        // console.log(`[AuthUtils] Token found in header '${headerKey}'`);
        return token;
      }
    }

    // 2. Check Cookies
    if (req.cookies && req.cookies[cookieKey]) {
      token = req.cookies[cookieKey];
      if (token && token !== "null" && token !== "undefined") {
        // console.log(`[AuthUtils] Token found in cookie '${cookieKey}'`);
        return token;
      }
    }

    console.log(`[AuthUtils] Token not found for type '${type}'`);
    return null; // Token not found in header or cookies
  }

  /**
   * @param {string} token - The JWT token string.
   * @returns {object|null} The decoded payload if valid, otherwise null.
   */
  static verifyToken(token) {
    if (!token || !process.env.JWT_SECRET_KEY) {
      console.error("AuthUtils.verifyToken: Token or JWT_SECRET_KEY missing.");
      return null;
    }
    try {
      // This will throw an error if token is invalid or expired
      return jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (error) {
      // Log specific JWT errors for better debugging
      if (error.name === "TokenExpiredError") {
        console.warn(
          `AuthUtils.verifyToken: Token expired at ${new Date(
            error.expiredAt * 1000
          )}`
        );
      } else if (error.name === "JsonWebTokenError") {
        console.warn(`AuthUtils.verifyToken: Invalid token - ${error.message}`);
      } else {
        console.error(
          `AuthUtils.verifyToken: Verification failed unexpectedly: ${error.name}`,
          error
        );
      }
      return null; // Indicate verification failure
    }
  }

  /**
   * @param {object} userOrShop - Mongoose User or Shop document (must have .getJwtToken method).
   * @param {string} [type='user'] - 'user' or 'seller'.
   * @returns {{token: string, cookieOptions: object, userData: object}}
   * @throws {Error} If input is invalid or token generation fails.
   */
  static generateTokenResponse(userOrShop, type = "user") {
    // Validate input object and method existence
    if (!userOrShop || typeof userOrShop.getJwtToken !== "function") {
      const objectType = userOrShop?.constructor?.name || typeof userOrShop;
      console.error(
        `AuthUtils.generateTokenResponse: Invalid object provided (Type: ${objectType}). Must have a .getJwtToken method.`,
        { type }
      );
      throw new Error(`Cannot generate token response: Invalid ${type} data.`);
    }

    try {
      const token = userOrShop.getJwtToken(); // Call the method on the instance
      const cookieOptions = AuthUtils.getCookieOptions(type); // Get appropriate cookie options

      const responseData = userOrShop.toObject
        ? userOrShop.toObject()
        : { ...userOrShop };
      delete responseData.password; // ** CRITICAL: Never send password hash **

      return { token, cookieOptions, userData: responseData };
    } catch (error) {
      console.error(
        `AuthUtils.generateTokenResponse: Error during token generation or data preparation for ${type} ID ${userOrShop._id}:`,
        error
      );
      throw new Error(`Failed to generate token response: ${error.message}`);
    }
  }
}

module.exports = AuthUtils;
