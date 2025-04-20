// File: backend/utils/jwtToken.js
const AuthUtils = require("./authUtils");
const sendToken = (t, e, s) => {
  try {
    const {
      token: r,
      cookieOptions: a,
      userData: n,
    } = AuthUtils.generateTokenResponse(t, "user");
    s.status(e).cookie("token", r, a).json({ success: !0, token: r, user: n });
  } catch (t) {
    console.error("[sendToken User Error]:", t),
      s.status(500).json({ success: !1, message: "Auth response error." });
  }
};

module.exports = { sendToken };
