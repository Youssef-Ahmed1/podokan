const nodemailer = require("nodemailer");

const sendMail = async (options) => {
  console.log("Starting email send process");
  
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465',
      service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
      debug: true
    });

    // Verify connection configuration
    await transporter.verify();
    console.log("SMTP connection verified");

    const mailOptions = {
      from: `"PODokan" <${process.env.SMTP_MAIL}>`,
      to: options.email,
      subject: options.subject,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return info;

  } catch (error) {
    console.error("Email sending failed:", {
      error: error.message,
      stack: error.stack,
      code: error.code
    });
    throw error;
  }
};

// Test the email configuration
const testEmailConfig = async () => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      }
    });

    const verified = await transporter.verify();
    console.log("SMTP Configuration verified:", verified);
    return verified;
  } catch (error) {
    console.error("SMTP Configuration error:", error);
    return false;
  }
};

module.exports = { 
  sendMail,
  testEmailConfig 
};