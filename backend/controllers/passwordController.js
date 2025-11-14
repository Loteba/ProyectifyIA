// backend/controllers/passwordController.js
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const { sendMail } = require('../config/email');

// POST /api/users/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    res.status(400);
    throw new Error('Email requerido');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    res.status(404);
    throw new Error('El correo indicado no está registrado');
  }

  // Crear token raw y almacenar su hash
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

  user.passwordResetToken = hashed;
  user.passwordResetExpires = expires;
  await user.save();

  const base = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
  const resetLink = `${base}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

  await sendMail({
    to: normalizedEmail,
    subject: 'Recuperación de contraseña',
    text: `Hemos recibido tu solicitud de restablecimiento. Usa el siguiente enlace para crear una nueva contraseña. El enlace es válido por 15 minutos: ${resetLink}` ,
    html: `<p>Hemos recibido tu solicitud de restablecimiento.</p>
           <p>Usa el siguiente enlace para crear una nueva contraseña (válido por <strong>15 minutos</strong>):</p>
           <p><a href="${resetLink}">${resetLink}</a></p>
           <p>Si no solicitaste este cambio, ignora este mensaje.</p>`
  });

  return res.json({
    message: 'Enviamos un enlace de restablecimiento a tu correo. Tienes 15 minutos para completar el proceso. Revisa también tu carpeta de spam.',
  });
});

// POST /api/users/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { email, token, password } = req.body || {};
  if (!email || !token || !password) {
    res.status(400);
    throw new Error('Datos incompletos');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    email: normalizedEmail,
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Token inválido o expirado');
  }

  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
  const salt = await bcrypt.genSalt(Number.isFinite(rounds) ? rounds : 10);
  user.password = await bcrypt.hash(password, salt);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return res.json({ message: 'Contraseña actualizada correctamente' });
});

module.exports = { forgotPassword, resetPassword };
