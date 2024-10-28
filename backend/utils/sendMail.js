const nodemailer = require("nodemailer");

 const sendMail = async (options) => {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'moropass1212@gmail.com', 
        pass: 'zqkxjfttywkzisss'  ,
        tls: {
          ciphers: 'SSLv3',
        },
        port: 465,
        secure: true,    
      }
    });

    // Set up email data
    const mailOptions = {
      from: '"PODokan" <moropass1212@gmail.com>',
      to: options.email,
      subject: options.subject,
      html: options.html
    };

    // Send mail and return info
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email error details:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    throw error;
  }
};

module.exports = sendMail;