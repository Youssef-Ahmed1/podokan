// utils/refreshToken.js
const jwt = require('jsonwebtoken');
const User = require('../model/user');

const refreshToken = async (oldToken) => {
  try {
    const decoded = jwt.verify(oldToken, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new Error('User not found');
    }

    return user.getJwtToken();
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

module.exports = refreshToken;