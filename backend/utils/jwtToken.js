const sendToken = (user, statusCode, res) => {
  const token = user.getJwtToken();
  
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'PRODUCTION',
    sameSite: 'strict',
    domain: process.env.NODE_ENV === 'PRODUCTION' ? '.testpodokan.store' : undefined,
    path: '/'
  };

  // Remove sensitive data
  const userData = user.toObject();
  delete userData.password;

  res.cookie('token', token, cookieOptions)
     .status(statusCode)
     .json({
       success: true,
       token,
       user: userData
     });
};

module.exports = sendToken;