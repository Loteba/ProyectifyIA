const mongoose = require('mongoose');

const projectWorkLinkSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, unique: true },
    url: { type: String, default: '' },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

projectWorkLinkSchema.index({ project: 1 }, { unique: true });

module.exports = mongoose.model('ProjectWorkLink', projectWorkLinkSchema);

