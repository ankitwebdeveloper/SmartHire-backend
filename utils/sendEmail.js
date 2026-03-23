const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create a transporter. Defaulting to Gmail for ease of setup.
  // The user MUST provide SMTP_EMAIL and SMTP_PASSWORD in their .env
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const message = {
    from: `${process.env.FROM_NAME || 'SmartHire Support'} <${process.env.SMTP_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  const info = await transporter.sendMail(message);
  console.log('[EMAIL SENT] Message sent: %s', info.messageId);
};

module.exports = sendEmail;
