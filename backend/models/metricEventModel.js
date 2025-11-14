// backend/models/metricEventModel.js
const mongoose = require('mongoose');

const metricEventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, required: true }, // e.g., summary_generated
    meta: { type: Object },
  },
  { timestamps: true }
);

metricEventSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('MetricEvent', metricEventSchema);

