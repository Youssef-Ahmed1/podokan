const jwt = require("jsonwebtoken");

// Define default cookie expiration (e.g., 7 days)
const DEFAULT_COOKIE_EXPIRY_DAYS = parseInt(
  process.env.COOKIE_EXPIRE_DAYS || "7",
  10
);

class AuthUtils {
  /**
   * Generates standard cookie options.
   * @param {string} [type='user'] - Type ('user' or 'seller') - currently unused but available for future distinction.
   * @returns {object} Cookie options object.
   */
  static getCookieOptions(type = "user") {
    return {
      expires: new Date(
        Date.now() + DEFAULT_COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
      ),
      httpOnly: true, // Cannot be accessed by client-side JS
      secure: process.env.NODE_ENV === "production", // Send only over HTTPS in production
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // 'none' for cross-domain prod, 'lax' for dev
      path: "/", // Cookie is valid for the entire site
      // domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined, // Uncomment and set if using subdomains
    };
  }

  /**
   * Extracts JWT from request headers (Bearer) or cookies.
   * Prioritizes Authorization/Seller-Authorization header.
   * @param {object} req - Express request object.
   * @param {string} [type='user'] - Type of token ('user' or 'seller').
   * @returns {string|null} The token or null if not found.
   */
  static getTokenFromRequest(req, type = "user") {
    const headerKey =
      type === "seller" ? "seller-authorization" : "authorization";
    const cookieKey = type === "seller" ? "seller_token" : "token";
    let token = null;

    const authHeader = req.headers[headerKey];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
      if (token) return token; // Return immediately if found in header
    }

    // If not in header, check cookies
    if (req.cookies && req.cookies[cookieKey]) {
      token = req.cookies[cookieKey];
    }

    return token || null;
  }

  /**
   * Verifies a JWT token using the secret key.
   * @param {string} token - The JWT token string.
   * @returns {object|null} The decoded payload or null if invalid/expired.
   */
  static verifyToken(token) {
    if (!token || !process.env.JWT_SECRET_KEY) {
      console.error("AuthUtils.verifyToken: Token or JWT_SECRET_KEY missing.");
      return null;
    }
    try {
      return jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (error) {
      console.warn(
        `AuthUtils.verifyToken: Verification failed - ${error.name}`
      );
      return null;
    }
  }

  /**
   * Generates token, cookie options, and sanitized user data for response.
   * Assumes the user/shop object has a getJwtToken() method defined.
   * @param {object} userOrShop - The user or shop Mongoose document.
   * @param {string} [type='user'] - Type ('user' or 'seller').
   * @returns {{token: string, cookieOptions: object, userData: object}}
   * @throws {Error} If userOrShop is invalid or missing getJwtToken method.
   */
  static generateTokenResponse(userOrShop, type = "user") {
    if (!userOrShop || typeof userOrShop.getJwtToken !== "function") {
      console.error(
        "AuthUtils.generateTokenResponse: Invalid object or getJwtToken missing.",
        { type, hasMethod: typeof userOrShop?.getJwtToken }
      );
      throw new Error(
        "Cannot generate token response: Invalid user/shop data."
      );
    }

    const token = userOrShop.getJwtToken();
    const cookieOptions = AuthUtils.getCookieOptions(type);

    const userData = userOrShop.toObject
      ? userOrShop.toObject()
      : { ...userOrShop };
    delete userData.password; // Ensure password is never sent

    return {
      token,
      cookieOptions,
      userData,
    };
  }
}

module.exports = AuthUtils;
