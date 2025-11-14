// backend/controllers/metricsController.js
const asyncHandler = require('express-async-handler');
const Project = require('../models/projectModel');
const LibraryItem = require('../models/libraryItemModel');
const MetricEvent = require('../models/metricEventModel');

// GET /api/admin/metrics/overview
const overview = asyncHandler(async (req, res) => {
  const [projects, papers, summaries] = await Promise.all([
    Project.countDocuments({}),
    LibraryItem.countDocuments({}),
    MetricEvent.countDocuments({ type: 'summary_generated' }),
  ]);
  res.json({ projects, papers, summaries });
});

// GET /api/admin/metrics/export?format=csv
const exportMetrics = asyncHandler(async (req, res) => {
  const format = (req.query.format || 'csv').toString();
  const [projects, papers, summaries] = await Promise.all([
    Project.countDocuments({}),
    LibraryItem.countDocuments({}),
    MetricEvent.countDocuments({ type: 'summary_generated' }),
  ]);
  const rows = [
    ['metric', 'value'],
    ['projects', projects],
    ['papers', papers],
    ['summaries', summaries],
  ];
  if (format === 'json') return res.json({ projects, papers, summaries });
  const csv = rows.map(r => r.join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="metrics.csv"');
  res.send(csv);
});

module.exports = { overview, exportMetrics };

// GET /api/admin/metrics/timeseries?days=30
const timeseries = asyncHandler(async (req, res) => {
  const days = Math.max(1, Math.min(parseInt(req.query.days || '30', 10) || 30, 180));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const group = [
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ];

  const [proj, lib, summ] = await Promise.all([
    Project.aggregate(group),
    LibraryItem.aggregate(group),
    MetricEvent.aggregate([{ $match: { createdAt: { $gte: since }, type: 'summary_generated' } }, ...group.slice(1)])
  ]);

  const dates = new Set([...proj, ...lib, ...summ].map(d => d._id));
  const result = Array.from(dates).sort().map(d => ({
    date: d,
    projects: proj.find(x => x._id === d)?.count || 0,
    papers: lib.find(x => x._id === d)?.count || 0,
    summaries: summ.find(x => x._id === d)?.count || 0,
  }));

  res.json({ since, days, data: result });
});

module.exports.timeseries = timeseries;

// --------- MÉTRICAS POR USUARIO (scope: me) ---------
// GET /api/metrics/overview
const userOverview = asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const [projects, papers, summaries] = await Promise.all([
    Project.countDocuments({ user: uid }),
    LibraryItem.countDocuments({ user: uid }),
    MetricEvent.countDocuments({ type: 'summary_generated', user: uid }),
  ]);
  res.json({ projects, papers, summaries });
});

// GET /api/metrics/timeseries?days=30
const userTimeseries = asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const days = Math.max(1, Math.min(parseInt(req.query.days || '30', 10) || 30, 180));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const proj = await Project.aggregate([
    { $match: { user: uid, createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const lib = await LibraryItem.aggregate([
    { $match: { user: uid, createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const summ = await MetricEvent.aggregate([
    { $match: { user: uid, type: 'summary_generated', createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const dates = new Set([...proj, ...lib, ...summ].map(d => d._id));
  const result = Array.from(dates).sort().map(d => ({
    date: d,
    projects: proj.find(x => x._id === d)?.count || 0,
    papers: lib.find(x => x._id === d)?.count || 0,
    summaries: summ.find(x => x._id === d)?.count || 0,
  }));

  res.json({ since, days, data: result });
});

module.exports.userOverview = userOverview;
module.exports.userTimeseries = userTimeseries;
