const jwt = require("jsonwebtoken");

const DEFAULT_COOKIE_EXPIRY_DAYS = parseInt(
  process.env.COOKIE_EXPIRE_DAYS || "7",
  10
);

class AuthUtils {
  static getCookieOptions(type = "user") {
    const isProduction = process.env.NODE_ENV === "production";
    return {
      expires: new Date(
        Date.now() + DEFAULT_COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
      ),
      httpOnly: true, // Cannot be accessed by client-side JS
      secure: isProduction, // Should be true in production (HTTPS)
      sameSite: isProduction ? "none" : "lax", // 'none' requires Secure=true; use 'lax' for same-site or HTTP dev
      path: "/",
      // domain: isProduction ? '.testpodokan.store' : undefined, // Only set if using subdomains (e.g., api.testpodokan.store)
    };
  }

  static getTokenFromRequest(req, type = "user") {
    const headerKey =
      type === "seller" ? "seller-authorization" : "authorization";
    const cookieKey = type === "seller" ? "seller_token" : "token";
    let token = null;

    const authHeader = req.headers[headerKey];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
      if (token && token !== "null" && token !== "undefined") return token;
    }

    if (req.cookies && req.cookies[cookieKey]) {
      token = req.cookies[cookieKey];
      if (token && token !== "null" && token !== "undefined") return token;
    }

    return null;
  }

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

  static generateTokenResponse(userOrShop, type = "user") {
    if (!userOrShop || typeof userOrShop.getJwtToken !== "function") {
      console.error(
        "AuthUtils.generateTokenResponse: Invalid object or getJwtToken missing.",
        { type, objectType: userOrShop?.constructor?.name }
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
    delete userData.password; // CRITICAL: Never expose password hash
    return { token, cookieOptions, userData };
  }
}

module.exports = AuthUtils;
