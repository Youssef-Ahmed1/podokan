const nodemailer = require("nodemailer");

const sendMail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'moropass1212@gmail.com',
      pass: 'zqkxjfttywkzisss'
    }
  });

  const mailOptions = {
    from: 'moropass1212@gmail.com',
    to: options.email,
    subject: options.subject,
    html: options.html
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = sendMail;