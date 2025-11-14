// backend/controllers/privacyController.js
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const Project = require('../models/projectModel');
const Task = require('../models/taskModel');
const LibraryItem = require('../models/libraryItemModel');
const { getDropboxClient } = require('../services/dropboxClient');

// @desc    Obtener perfil del usuario autenticado
// @route   GET /api/users/me
// @access  Privado
const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// @desc    Eliminar cuenta del usuario (LPDP - derecho de supresiÃ³n)
// @route   DELETE /api/users/me
// @access  Privado
const deleteMe = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  await Promise.all([
    Project.deleteMany({ user: userId }),
    Task.deleteMany({ user: userId }),
    LibraryItem.deleteMany({ user: userId }),
  ]);

  await User.deleteOne({ _id: userId });

  return res.status(204).send();
});

module.exports = { getMe, deleteMe };
// @desc    Actualizar perfil del usuario autenticado (nombre, email y/o contraseÃ±a)
// @route   PUT /api/users/me
// @access  Privado
const updateMe = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { name, email, currentPassword, newPassword } = req.body || {};

  const user = await User.findById(userId);
  if (!user) { res.status(404); throw new Error('Usuario no encontrado'); }

  // Si se intenta cambiar el email, exigir contraseÃ±a actual y unicidad
  if (typeof email === 'string' && email.trim() && email !== user.email) {
    const newEmail = email.trim();
    const exists = await User.findOne({ email: newEmail, _id: { $ne: userId } });
    if (exists) { res.status(400); throw new Error('El email ya estÃ¡ en uso'); }
    if (!currentPassword) { res.status(400); throw new Error('Debes indicar tu contraseÃ±a actual para cambiar el correo'); }
    const okPwd = await bcrypt.compare(currentPassword, user.password);
    if (!okPwd) { res.status(400); throw new Error('ContraseÃ±a actual incorrecta'); }
    user.email = newEmail;
  }

  // Cambiar nombre
  if (typeof name === 'string' && name.trim()) {
    user.name = name.trim();
  }

  // Cambiar contraseÃ±a (requiere currentPassword)
  if (typeof newPassword === 'string' && newPassword.length > 0) {
    if (!currentPassword) { res.status(400); throw new Error('Debes indicar tu contraseÃ±a actual'); }
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) { res.status(400); throw new Error('ContraseÃ±a actual incorrecta'); }
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
    const salt = await bcrypt.genSalt(Number.isFinite(rounds) ? rounds : 10);
    user.password = await bcrypt.hash(newPassword, salt);
  }

  await user.save();

  res.json({ _id: user.id, name: user.name, email: user.email, role: user.role });
});

module.exports.updateMe = updateMe;

// @desc    Comprobar si un email estÃ¡ disponible (excluyendo el del propio usuario)
// @route   GET /api/users/check-email?email=...
// @access  Privado
const checkEmailUnique = asyncHandler(async (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!email) return res.json({ available: false, reason: 'empty' });
  const exists = await User.findOne({ email, _id: { $ne: req.user._id } }).select('_id').lean();
  res.json({ available: !Boolean(exists) });
});

module.exports.checkEmailUnique = checkEmailUnique;

// @desc    Actualizar avatar del usuario autenticado
// @route   PUT /api/users/me/avatar
// @access  Privado (multipart/form-data con campo 'avatar')
const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400); throw new Error('No se recibiÃ³ imagen'); }
  const mime = req.file.mimetype || '';
  if (!mime.startsWith('image/')) { res.status(400); throw new Error('El archivo debe ser una imagen'); }
  if (req.file.size > 2 * 1024 * 1024) { res.status(400); throw new Error('La imagen supera 2MB'); }

  const dbx = await getDropboxClient();
  const now = Date.now();
  const ext = mime.split('/')[1] || 'png';
  const filePath = `/proyectifyia/avatars/${req.user._id}_${now}.${ext}`;

  const uploaded = await dbx.filesUpload({ path: filePath, contents: req.file.buffer, mode: { '.tag': 'overwrite' } });
  const shared = await dbx.sharingCreateSharedLinkWithSettings({ path: uploaded.result.path_lower, settings: { requested_visibility: 'public' } });
  const url = shared.result.url.replace('?dl=0', '?raw=1');

  await User.updateOne({ _id: req.user._id }, { $set: { avatarUrl: url } });
  res.json({ avatarUrl: url });
});

module.exports.updateAvatar = updateAvatar;
