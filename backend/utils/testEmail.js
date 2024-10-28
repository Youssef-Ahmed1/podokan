require('dotenv').config({ path:'../config/.env' });
const sendMail = require('../utils/sendMail');  
const testEmail = async () => {
  try {
    console.log('Starting email test...');
    console.log('SMTP Settings:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      service: process.env.SMTP_SERVICE,
      user: process.env.SMTP_MAIL
    });

    await sendMail({
      email: 'moropass1212@gmail.com',
      subject: 'Test Email from PODokan',
      html: `
        <div style="padding: 20px; font-family: Arial;">
          <h2>Test Email</h2>
          <p>This is a test email from PODokan using Nodemailer.</p>
          <p>Time sent: ${new Date().toLocaleString()}</p>
        </div>
      `
    });

    console.log('Test email sent successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
  process.exit();
};

testEmail();