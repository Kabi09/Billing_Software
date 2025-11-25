const nodemailer = require("nodemailer");
const dotenv=require("dotenv")
dotenv.config()
const SHOP_NAME=process.env.SHOP_NAME



async function sendEmail(to, subject, html) {
  // Create the transporter HERE, inside the function
  // This ensures process.env is fully loaded before we check it
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, 
    },
  });

  const mailOptions = {
    from: `${SHOP_NAME} <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = sendEmail;