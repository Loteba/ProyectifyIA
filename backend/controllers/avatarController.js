// backend/controllers/avatarController.js
const asyncHandler = require('express-async-handler');
const fs = require('fs');
const path = require('path');
const User = require('../models/userModel');

// @desc    Actualizar avatar del usuario autenticado (almacen local)
// @route   PUT /api/users/me/avatar
// @access  Privado (multipart/form-data con campo 'avatar')
const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400); throw new Error('No se recibió imagen'); }
  const mime = req.file.mimetype || '';
  if (!mime.startsWith('image/')) { res.status(400); throw new Error('El archivo debe ser una imagen'); }
  if (req.file.size > 2 * 1024 * 1024) { res.status(400); throw new Error('La imagen supera 2MB'); }

  const now = Date.now();
  const ext = (mime.split('/')[1] || 'png').replace(/[^a-z0-9]/gi, '').toLowerCase();
  const fileName = `${req.user._id}_${now}.${ext}`;
  const dir = path.join(__dirname, '..', 'uploads', 'avatars');
  await fs.promises.mkdir(dir, { recursive: true });
  const absPath = path.join(dir, fileName);
  await fs.promises.writeFile(absPath, req.file.buffer);

  const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
  const url = `${base}/uploads/avatars/${fileName}`;

  await User.updateOne({ _id: req.user._id }, { $set: { avatarUrl: url } });
  res.json({ avatarUrl: url });
});

module.exports = { updateAvatar };

