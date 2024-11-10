const sendToken = (user, statusCode, res) => {
  const token = user.getJwtToken();

  // Cookie options
  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'PRODUCTION',
    sameSite: 'strict',
    path: '/',
    domain: process.env.NODE_ENV === 'PRODUCTION' ? '.testpodokan.store' : undefined
  };

  res.status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      user,
      token,
    });
};

module.exports = sendToken;