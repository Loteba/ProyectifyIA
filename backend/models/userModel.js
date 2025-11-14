// backend/models/userModel.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor, introduce un nombre'],
  },
  email: {
    type: String,
    required: [true, 'Por favor, introduce un email'],
    unique: true,
    match: [/.+\@.+\..+/, 'Por favor, introduce un email vÃ¡lido'],
  },
  password: {
    type: String,
    required: [true, 'Por favor, introduce una contraseÃ±a'],
  },
}, {
  timestamps: true,
});

// Campo de rol (por defecto 'user') para gestiÃ³n de permisos
userSchema.add({
  role: {
    type: String,
    // Mantener 'user' por compatibilidad; añadir nuevos roles
    enum: ['superadmin','admin','investigador','estudiante','user'],
    default: 'user',
    required: true,
  },
});

// Campos para recuperación de contraseña
userSchema.add({
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
});

// Preferencias de usuario (configuracion)
userSchema.add({
  settings: {
    notifyEmailOnArticle: { type: Boolean, default: true },
    language: { type: String, default: 'es' },
    theme: { type: String, default: 'light' },
  },
});

// Avatar del usuario (URL pública)
userSchema.add({
  avatarUrl: { type: String },
});

module.exports = mongoose.model('User', userSchema);

