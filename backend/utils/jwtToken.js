const AuthUtils = require('./authUtils');

const sendToken = (user, statusCode, res) => {
  const { token, cookieOptions, userData } = AuthUtils.generateTokenResponse(user);

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .header('Authorization', `Bearer ${token}`)
    .json({
      success: true,
      token,
      user: userData
    });
};

module.exports = sendToken;
