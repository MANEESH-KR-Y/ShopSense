const nodemailer = require('nodemailer');
require('dotenv').config(); // Load .env from verify CWD (backend)

async function testEmail() {
  console.log('--- TESTING EMAIL DELIVERY ---');
  console.log('User:', process.env.SMTP_USER);
  // Don't log full password
  console.log('Pass:', process.env.SMTP_PASS ? '****' : 'MISSING');

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"ShopSense Test" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to self
      subject: 'ShopSense SMTP Test',
      text: 'If you see this, email configuration is WORKING!',
    });
    console.log('SUCCESS: Email sent!');
    console.log('Message ID:', info.messageId);
  } catch (err) {
    console.error('FAILURE: Could not send email.');
    console.error(err);
  }
}

testEmail();
