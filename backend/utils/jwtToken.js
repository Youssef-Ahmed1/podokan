// utils/jwtToken.js
const jwt = require('jsonwebtoken');

const sendToken = (user, statusCode, res) => {
  // Create token
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET_KEY,
    { expiresIn: process.env.JWT_EXPIRES }
  );

  // Cookie options
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    domain: '.testpodokan.store',
    path: '/'
  };

  // Remove sensitive data
  const userResponse = user.toObject ? user.toObject() : { ...user };
  if (userResponse.password) delete userResponse.password;

  // Set cookie and send response
  return res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: userResponse
    });
};

module.exports = sendToken;