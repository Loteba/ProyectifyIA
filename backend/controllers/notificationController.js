// backend/controllers/notificationController.js
const asyncHandler = require('express-async-handler');
const Notification = require('../models/notificationModel');

// GET /api/notifications
const listMyNotifications = asyncHandler(async (req, res) => {
  const items = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
  res.json(items);
});

// POST /api/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const n = await Notification.findOne({ _id: id, user: req.user._id });
  if (!n) {
    res.status(404);
    throw new Error('Notificación no encontrada');
  }
  n.read = true;
  await n.save();
  res.json({ ok: true });
});

// POST /api/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
  res.json({ ok: true });
});

// GET /api/notifications/unread-count
const unreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user._id, read: false });
  res.json({ count });
});

module.exports = { listMyNotifications, markRead, markAllRead, unreadCount };
