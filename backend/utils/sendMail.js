const nodemailer = require("nodemailer");

const sendMail = async (options) => {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // use SSL
      auth: {
        user: 'moropass1212@gmail.com',
        pass: 'zqkxjfttywkzisss'
      },
      tls: {
        rejectUnauthorized: false // Only if you're having certificate issues
      }
    });

    // Email content
    const mailOptions = {
      from: '"PODokan Support" <moropass1212@gmail.com>',
      to: options.email,
      subject: options.subject,
      html: options.html
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("Email Error:", {
      code: error.code,
      message: error.message,
      stack: error.stack,
      command: error.command
    });
    throw error;
  }
};

module.exports = sendMail;