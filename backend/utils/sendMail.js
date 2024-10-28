const nodemailer = require("nodemailer");

const sendMail = async (options) => {
  // Create transporter with OAuth2
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'moropass1212@gmail.com',
      pass: 'zqkxjfttywkzisss'
    }
  });

  // Verify the connection configuration
  try {
    await transporter.verify();
    console.log('SMTP connection verified');
  } catch (error) {
    console.error('SMTP Verification Error:', error);
    throw error;
  }

  const message = {
    from: '"PODokan" <moropass1212@gmail.com>',
    to: options.email,
    subject: options.subject,
    html: options.html
  };

  try {
    const info = await transporter.sendMail(message);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Send Mail Error:', error);
    throw error;
  }
};
// Add this function to test the email configuration
const testEmail = async () => {
  try {
    await sendMail({
      email: 'moropass1212@gmail.com',
      subject: 'Test Email',
      html: '<h1>Test Email</h1><p>This is a test email</p>'
    });
    console.log('Test email sent successfully');
  } catch (error) {
    console.error('Test email failed:', error);
  }
};

module.exports = { sendMail, testEmail };
module.exports = sendMail;