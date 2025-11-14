const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('express-async-handler');
const Task = require('../models/taskModel');
const Project = require('../models/projectModel');
const ProjectMember = require('../models/projectMemberModel');

// GET /api/tasks/upcoming?days=7
router.get('/upcoming', protect, asyncHandler(async (req, res) => {
  const days = Math.max(0, Number(req.query.days || 7));
  const now = new Date();
  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const fallback = 7; // para tareas antiguas sin dueDate

  // proyectos donde es owner
  const own = await Project.find({ user: req.user._id }).select('_id').lean();
  const ownIds = own.map(p => p._id);
  // proyectos donde es miembro
  const members = await ProjectMember.find({ user: req.user._id }).select('project').lean();
  const memberIds = members.map(m => m.project);
  const projectIds = [...new Set([...ownIds, ...memberIds])];

  if (projectIds.length === 0) return res.json([]);

  const base = {
    project: { $in: projectIds },
    status: { $in: ['Pendiente','En Progreso'] },
  };

  const tasks = await Task.find({
    $and: [ base, { $or: [
      { dueDate: { $gte: now, $lte: until } },
      // incluir tareas sin dueDate creadas en los últimos 7 días (asumir dueDate = createdAt + 7)
      { $and: [ { dueDate: { $exists: false } }, { createdAt: { $gte: new Date(now.getTime() - fallback*24*60*60*1000), $lte: now } } ] }
    ] } ]
  }).sort({ dueDate: 1, createdAt: -1 }).lean();

  res.json(tasks);
}));

module.exports = router;
