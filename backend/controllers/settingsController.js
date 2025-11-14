// backend/controllers/settingsController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

// GET /api/settings
const getSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('settings');
  const settings = user?.settings || { notifyEmailOnArticle: true, language: 'es', theme: 'light' };
  res.json(settings);
});

// PUT /api/settings
const updateSettings = asyncHandler(async (req, res) => {
  const allowed = ['notifyEmailOnArticle', 'language', 'theme'];
  const payload = req.body || {};
  const updates = {};
  for (const k of allowed) if (k in payload) updates[`settings.${k}`] = payload[k];
  await User.updateOne({ _id: req.user._id }, { $set: updates });
  const user = await User.findById(req.user._id).select('settings');
  res.json(user.settings);
});

module.exports = { getSettings, updateSettings };

