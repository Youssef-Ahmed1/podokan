const nodemailer = require("nodemailer");

const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD
    },
    tls: {
      rejectUnauthorized: true
    }
  });
};

const sendMail = async (options) => {
  try {
    // Validate required fields
    if (!options.email || !options.subject || !options.html) {
      throw new Error('Missing required email fields');
    }

    // Validate email configuration
    if (!process.env.SMTP_MAIL || !process.env.SMTP_PASSWORD) {
      throw new Error('Missing email configuration');
    }

    const transporter = createTransporter();

    // Verify connection configuration
    await transporter.verify();

    const mailOptions = {
      from: `"PODokan" <${process.env.SMTP_MAIL}>`,
      to: options.email,
      subject: options.subject,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', {
      messageId: info.messageId,
      to: options.email,
      subject: options.subject
    });

    return true;
  } catch (error) {
    console.error('SendMail Error:', {
      error: error.message,
      stack: error.stack,
      config: {
        host: 'smtp.gmail.com',
        port: 465,
        user: process.env.SMTP_MAIL
      }
    });
    throw error;
  }
};

// Export as a single function
module.exports = sendMail;