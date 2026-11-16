const nodemailer = require('nodemailer');

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
    return transporter;
  }

  // Fallback to console logger transport for local development/prototype
  transporter = {
    sendMail: async (options) => {
      console.log('--- [MOCK EMAIL DISPATCHED] ---');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Body: ${options.text || options.html}`);
      console.log('-------------------------------');
      return { messageId: 'mock-email-' + Date.now() };
    },
  };

  return transporter;
}

async function sendTemporaryPasswordEmail({ to, name, temporaryPassword }) {
  try {
    const t = await getTransporter();
    const from = process.env.SMTP_FROM || 'noreply@learnmate.test';

    const text = `Hello ${name},\n\nYour LearnMate account has been provisioned.\nTemporary Password: ${temporaryPassword}\n\nPlease log in at your portal and change your password immediately upon your first sign-in.\n\nLearnMate Administration`;
    const html = `<p>Hello <strong>${name}</strong>,</p>
      <p>Your LearnMate account has been created/reset.</p>
      <p><strong>Temporary Password:</strong> <code>${temporaryPassword}</code></p>
      <p>Please log in and update your password immediately upon first sign-in.</p>`;

    const result = await t.sendMail({
      from,
      to,
      subject: 'LearnMate Portal - Your Temporary Credentials',
      text,
      html,
    });
    return { success: true, result };
  } catch (error) {
    console.warn(`Could not send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendTemporaryPasswordEmail,
};
