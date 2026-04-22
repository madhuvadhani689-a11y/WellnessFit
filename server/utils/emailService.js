const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

const sendEmail = async (toEmail, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"WellnessFit 🌿" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: subject,
      html: html
    });
    console.log('Email sent to:', toEmail);
  } catch (err) {
    console.error('Email failed:', err.message);
    // Never crash server — just log
  }
};

module.exports = { sendEmail };
