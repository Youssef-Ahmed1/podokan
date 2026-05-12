// Example Structure - Replace with your actual implementation
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
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      path: "/",
    };
  }

  static getTokenFromRequest(req, type = "user") {

    const cookieKey = type === "seller" ? "seller_token" : "token";

    if (req.cookies && req.cookies[cookieKey]) {
      let token = req.cookies[cookieKey];
      if (token && token !== "null" && token !== "undefined") return token;
    }
    return null;
  }

  static verifyToken(token) {
    if (!token || !process.env.JWT_SECRET_KEY) return null;
    try {
      return jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (error) {
      console.warn(`Token verification failed: ${error.name}`);
      return null;
    }
  }

  static generateTokenResponse(userOrShop, type = "user") {
    if (!userOrShop || typeof userOrShop.getJwtToken !== "function") {
      throw new Error(
        `Invalid object passed to generateTokenResponse for type ${type}.`
      );
    }
    const token = userOrShop.getJwtToken();
    const cookieOptions = AuthUtils.getCookieOptions(type);
    const responseData = userOrShop.toObject
      ? userOrShop.toObject()
      : { ...userOrShop };
    delete responseData.password;
    return { token, cookieOptions, userData: responseData };
  }
}

module.exports = AuthUtils;
