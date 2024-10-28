// test-email.js
require('dotenv').config();
const sendMail = require('./utils/sendMail');

async function testEmail() {
  try {
    await sendMail({
      email: "your-test-email@example.com",
      subject: "Test Email",
      html: "<h1>Test Email</h1><p>This is a test email from PODokan</p>"
    });
    console.log("Test email sent successfully");
  } catch (error) {
    console.error("Test email failed:", error);
  }
}

testEmail();