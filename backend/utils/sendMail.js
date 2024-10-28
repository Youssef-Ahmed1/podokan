const nodemailer = require("nodemailer");

const sendMail = async (options) => {
  try {
    // Create transporter with updated configuration
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true, 
      service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false 
      }
    });

    // Setup email options
    const mailOptions = {
      from: `"PODokan" <${process.env.SMTP_MAIL}>`, // Add a display name
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html
    };

    // Send email and wait for response
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return info;

  } catch (error) {
    console.error("Email sending error:", {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    throw new Error(`Failed to send email: ${error.message}`);
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