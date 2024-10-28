const nodemailer = require("nodemailer");

const sendMail = async (options) => {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE,
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: true, // for port 465
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Set up email options
    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
    };

    // Log email attempt
    console.log("Attempting to send email to:", options.email);

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return info;
  } catch (error) {
    console.error("Nodemailer Error:", error);
    throw error;
  }
};

module.exports = sendMail;