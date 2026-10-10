const nodemailer = require('nodemailer');
require('dotenv').config({ path: '/Users/yashgupta/IEX-Dashboard/backend/.env' });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'), // test with original 587
  secure: false, // false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Do not replace spaces
  },
});

async function test() {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Prolt Operations Centre" <proltenergy.operations@probus.io>',
      to: 'yash.gupta@example.com',
      subject: 'Test',
      text: 'Test',
    });
    console.log('Success:', info);
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
