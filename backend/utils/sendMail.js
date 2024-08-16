const nodemailer = require("nodemailer");

const sendMail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html, // Add this line to support HTML content
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    throw error; // Rethrow the error so it can be handled by the calling function
  }
};

// New function for sending product rejection emails
const sendProductRejectionEmail = async (sellerEmail, productName, rejectionReason) => {
  const subject = "Product Submission Rejected";
  const message = `Your product "${productName}" has been rejected. Reason: ${rejectionReason}`;
  const html = `
    <h1>Product Submission Rejected</h1>
    <p>Your product <strong>"${productName}"</strong> has been rejected.</p>
    <p><strong>Reason:</strong> ${rejectionReason}</p>
    <p>If you have any questions, please contact our support team.</p>
  `;

  await sendMail({
    email: sellerEmail,
    subject,
    message,
    html,
  });
};

module.exports = { sendMail, sendProductRejectionEmail };