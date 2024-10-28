require('dotenv').config();
const { testEmailConfig, sendMail } = require('../utils/sendMail');

async function testEmail() {
  try {
    console.log('Testing SMTP Configuration...');
    const isConfigValid = await testEmailConfig();
    
    if (isConfigValid) {
      console.log('SMTP Configuration is valid');
      
      // Send test email
      console.log('Sending test email...');
      await sendMail({
        email: process.env.SMTP_MAIL, // Send to yourself
        subject: 'Test Email',
        message: 'This is a test email',
        html: '<h1>Test Email</h1><p>This is a test email from PODokan</p>'
      });
      
      console.log('Test email sent successfully');
    } else {
      console.log('SMTP Configuration is invalid');
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testEmail();