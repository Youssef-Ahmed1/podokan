const nodemailer = require("nodemailer");

// Create the sendMail function
const sendMail = async (options) => {
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // Define mail options
  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  try {
    // Send mail
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to:", options.email);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Create the product rejection email function
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

module.exports = {
  sendMail,
  sendProductRejectionEmail
};