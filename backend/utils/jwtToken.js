const sendToken = (user, statusCode, res) => {
  const token = user.getJwtToken();
  
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain: process.env.NODE_ENV === 'production' ? '.testpodokan.store' : undefined
  };

  // Remove sensitive data
  const userData = user.toObject();
  delete userData.password;

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