const mongoose = require('mongoose');

const projectInvitationSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    inviter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    inviteeUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    inviteeEmail: { type: String, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'declined', 'canceled'], default: 'pending' },
  },
  { timestamps: true }
);

projectInvitationSchema.index({ inviteeEmail: 1, status: 1 });
projectInvitationSchema.index({ inviteeUser: 1, status: 1 });
projectInvitationSchema.index({ project: 1, inviteeEmail: 1, status: 1 });

module.exports = mongoose.model('ProjectInvitation', projectInvitationSchema);

