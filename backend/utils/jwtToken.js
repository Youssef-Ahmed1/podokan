// utils/sendToken.js
const sendToken = (user, statusCode, res) => {
  const token = user.getJwtToken();

  // Options for cookies
  const options = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: '/',
    domain: process.env.NODE_ENV === 'PRODUCTION' ? '.testpodokan.store' : undefined
  };

  // Set both cookie and authorization header
  res.status(statusCode)
     .cookie("token", token, options)
     .header('Authorization', `Bearer ${token}`)
     .json({
       success: true,
       user,
       token,
     });
};

module.exports = sendToken;