const sendToken = (user, statusCode, res) => {
  const token = user.getJwtToken();
  
  // Options for cookies
  const cookieOptions = {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      httpOnly: true,
      sameSite: "none",
      secure: true,
      path: '/',
      domain: process.env.NODE_ENV === 'PRODUCTION' ? '.testpodokan.store' : undefined
  };

  // Set authorization header
  const authHeader = `Bearer ${token}`;
  
  // Remove password from response
  if (user.toJSON) {
      user = user.toJSON();
  }
  if (user.password) {
      delete user.password;
  }

  return res
      .status(statusCode)
      .cookie("token", token, cookieOptions)
      .set('Authorization', authHeader)
      .json({
          success: true,
          user,
          token,
      });
};
module.exports = sendToken;