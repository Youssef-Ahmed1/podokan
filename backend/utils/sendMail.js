// utils/sendMail.js
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

const emailService = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"PODokan" <${process.env.SMTP_MAIL}>`,
      to: options.email,
      subject: options.subject,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('SendMail Error:', error);
    throw error;
  }
};

module.exports = emailService;