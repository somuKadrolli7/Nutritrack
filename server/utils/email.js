const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  // If credentials are available, use Gmail SMTP
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
      port:   Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Development fallback – logs to console
    transporter = {
      sendMail: async (opts) => {
        console.log('\n📧 [DEV EMAIL] ─────────────────────────');
        console.log(`To:      ${opts.to}`);
        console.log(`Subject: ${opts.subject}`);
        console.log(`Body:    ${opts.text || opts.html}`);
        console.log('─────────────────────────────────────────\n');
        return { messageId: 'dev-mode' };
      },
    };
  }

  return transporter;
}

exports.sendOTPEmail = async (to, otp) => {
  const t = getTransporter();
  return t.sendMail({
    from:    process.env.EMAIL_FROM || 'NutriTrack <noreply@nutritrack.app>',
    to,
    subject: 'Your NutriTrack OTP Code',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#6c63ff,#a78bfa);padding:32px;border-radius:16px 16px 0 0;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:28px">⚡ NutriTrack</h1>
        </div>
        <div style="background:#0d1528;padding:32px;border-radius:0 0 16px 16px">
          <p style="color:#e8edf7;font-size:16px">Here is your one-time verification code:</p>
          <div style="background:#1e293b;border-radius:12px;padding:24px;text-align:center;margin:20px 0">
            <span style="font-size:42px;font-weight:800;letter-spacing:12px;color:#a78bfa">${otp}</span>
          </div>
          <p style="color:#7a8aaa;font-size:13px">This code expires in <b>10 minutes</b>. Do not share it with anyone.</p>
        </div>
      </div>
    `,
  });
};

exports.sendPasswordResetEmail = async (to, otp) => {
  const t = getTransporter();
  return t.sendMail({
    from:    process.env.EMAIL_FROM || 'NutriTrack <noreply@nutritrack.app>',
    to,
    subject: 'NutriTrack — Password Reset Code',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#f72585,#f59e0b);padding:32px;border-radius:16px 16px 0 0;text-align:center">
          <h1 style="color:#fff;margin:0">🔐 Password Reset</h1>
        </div>
        <div style="background:#0d1528;padding:32px;border-radius:0 0 16px 16px">
          <p style="color:#e8edf7">Use this code to reset your NutriTrack password:</p>
          <div style="background:#1e293b;border-radius:12px;padding:24px;text-align:center;margin:20px 0">
            <span style="font-size:42px;font-weight:800;letter-spacing:12px;color:#f72585">${otp}</span>
          </div>
          <p style="color:#7a8aaa;font-size:13px">Expires in 10 minutes. If you didn't request this, ignore this email.</p>
        </div>
      </div>
    `,
  });
};
