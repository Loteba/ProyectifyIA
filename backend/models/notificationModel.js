// backend/models/notificationModel.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    body: { type: String },
    link: { type: String },
    read: { type: Boolean, default: false },
    type: { type: String, default: 'article' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);

