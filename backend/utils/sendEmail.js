const nodemailer = require('nodemailer');
const config = require('../config/config');

const sendEmail = async (options) => {
  // Създаване на транспортер
  const transporter = nodemailer.createTransport({
    host: config.EMAIL_HOST,
    port: config.EMAIL_PORT,
    secure: config.EMAIL_SECURE === 'true',
    auth: {
      user: config.EMAIL_USERNAME,
      pass: config.EMAIL_PASSWORD
    }
  });

  // Настройки на имейла
  const message = {
    from: `${config.EMAIL_FROM_NAME} <${config.EMAIL_FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  // Изпращане на имейла
  const info = await transporter.sendMail(message);

  console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail; 