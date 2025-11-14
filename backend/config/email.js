// backend/config/email.js
const nodemailer = require('nodemailer');
const axios = require('axios');

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '0', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';

  if (host && port && user && pass) {
    return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
  }

  // Fallback: stream to console for development
  return nodemailer.createTransport({ jsonTransport: true });
}

async function sendMail({ to, subject, html, text, from, replyTo }) {
  const mailFrom = from || process.env.RESEND_FROM || process.env.MAIL_FROM || 'no-reply@example.com';

  // 1) Preferir Resend si hay API key
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const body = {
        from: mailFrom, // Ej: "Proyectify <onboarding@resend.dev>" o remitente verificado
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
        reply_to: replyTo,
      };
      const resp = await axios.post('https://api.resend.com/emails', body, {
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 15000,
      });
      return { provider: 'resend', id: resp.data?.id, status: resp.status };
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      console.error('Resend error:', status, data);
      let reason = 'Email provider rejected the request';
      if (status === 403) {
        reason = 'Resend 403: API key inválida o remitente no verificado (verifica RESEND_API_KEY y RESEND_FROM).';
      } else if (status === 401) {
        reason = 'Resend 401: API key no autorizada.';
      }
      const e = new Error(`${reason}`);
      e.statusCode = status || 500;
      e.details = data;
      throw e;
    }
  }

  // 2) Fallback a nodemailer / JSON (dev)
  const transporter = createTransport();
  const info = await transporter.sendMail({ from: mailFrom, to, subject, html, text });
  if (transporter.options.jsonTransport || process.env.NODE_ENV !== 'production') {
    console.log('MAIL:', JSON.stringify(info.message || info, null, 2));
  }
  return info;
}

module.exports = { sendMail };
