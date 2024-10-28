// test-email.js
require('dotenv').config();
const sendMail = require('./utils/sendMail');

async function testEmail() {
  try {
    await sendMail({
      email: "moropass1212@gmail.com", // Test with your own email
      subject: "Test Email",
      html: "<h1>Test Email</h1><p>This is a test email from PODokan</p>"
    });
    console.log("Test email sent successfully");
  } catch (error) {
    console.error("Test failed:", error);
  }
  process.exit();
}

testEmail();