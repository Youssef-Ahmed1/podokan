const mongoose = require("mongoose");

const sendToken = (user, statusCode, res) => {
  const token = user.getJwtToken();

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'PRODUCTION',
    sameSite: 'strict',
    path: '/',
    domain: process.env.NODE_ENV === 'PRODUCTION' ? '.testpodokan.store' : undefined
  };

  // Remove password from output
  const userData = user.toObject();
  delete userData.password;

  res.status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: userData
    });
};

module.exports = sendToken;