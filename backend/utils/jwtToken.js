// utils/jwtToken.js
const jwt = require("jsonwebtoken");

const sendToken = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: "7d",
  });

  res.status(statusCode)
    .cookie("token", token, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: "none",
      secure: true,
      domain: ".testpodokan.store"
    })
    .json({
      success: true,
      user,
      token,
    });
};

module.exports = sendToken;