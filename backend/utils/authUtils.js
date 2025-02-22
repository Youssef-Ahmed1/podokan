// utils/authUtils.js
const jwt = require('jsonwebtoken');

class AuthUtils {
  static getTokenFromRequest(req, type = 'user') {
    const headerKey = type === 'seller' ? 'seller-authorization' : 'authorization';
    const cookieKey = type === 'seller' ? 'seller_token' : 'token';
    
    let token = req.headers[headerKey]?.split(' ')[1] || req.cookies[cookieKey];
    
    return token || null;
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (error) {
      return null;
    }
  }

  static generateTokenResponse(user, type = 'user') {
    const token = user.getJwtToken();
    
    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      domain: process.env.NODE_ENV === 'PRODUCTION' ? '.testpodokan.store' : undefined
    };

    const userData = user.toObject();
    delete userData.password;

    return {
      token,
      cookieOptions,
      userData
    };
  }
}

module.exports = AuthUtils;