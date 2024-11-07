// utils/sendToken.js
const sendToken = (user, statusCode, res) => {
    const token = user.getJwtToken();
    
    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      domain: process.env.NODE_ENV === 'PRODUCTION' ? '.testpodokan.store' : 'localhost'
    };
  
    // Remove password from user object
    if (user.toJSON) {
      user = user.toJSON();
    }
    delete user.password;
  
    return res
      .status(statusCode)
      .cookie("token", token, cookieOptions)
      .header('Authorization', `Bearer ${token}`)
      .json({
        success: true,
        token,
        user
      });
  };
  
  module.exports = sendToken;