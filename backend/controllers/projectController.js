const asyncHandler = require('express-async-handler');
const Project = require('../models/projectModel');
const Task = require('../models/taskModel');
const ProjectMember = require('../models/projectMemberModel');
const ProjectInvitation = require('../models/projectInvitationModel');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');
const { sendMail } = require('../config/email');
const axios = require('axios');
const ProjectResourceLink = require('../models/projectResourceLinkModel');

// OBTENER TODOS LOS PROYECTOS DEL USUARIO
const getProjects = asyncHandler(async (req, res) => {
  const own = await Project.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
  const memberships = await ProjectMember.find({ user: req.user._id }).select('project').lean();
  const memberProjectIds = memberships.map(m => m.project);
  let memberProjects = [];
  if (memberProjectIds.length) {
    memberProjects = await Project.find({ _id: { $in: memberProjectIds } }).sort({ createdAt: -1 }).lean();
  }
  // Merge unique by _id
  const map = new Map();
  [...own, ...memberProjects].forEach(p => map.set(String(p._id), p));
  res.status(200).json(Array.from(map.values()));
});

// CREAR UN NUEVO PROYECTO
const createProject = asyncHandler(async (req, res) => {
  const { name, description, areaTematica } = req.body;
  if (!name || !description || !areaTematica) {
    res.status(400);
    throw new Error('Por favor, completa todos los campos');
  }
  const project = await Project.create({ name, description, areaTematica, user: req.user.id });
  if (project && process.env.N8N_PROJECT_WEBHOOK_URL) {
    try {
      await axios.post(process.env.N8N_PROJECT_WEBHOOK_URL, {
        projectName: project.name, projectDescription: project.description,
        userName: req.user.name, userEmail: req.user.email,
      });
    } catch (error) {
      console.error('Error al disparar el webhook de n8n:', error.message);
    }
  }
  res.status(201).json(project);
});

// ACTUALIZAR UN PROYECTO
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) { res.status(404); throw new Error('Proyecto no encontrado'); }
  const isOwner = project.user.toString() === req.user.id;
  if (!isOwner) { res.status(401); throw new Error('No autorizado'); }
  const updatedProject = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.status(200).json(updatedProject);
});

// ELIMINAR UN PROYECTO
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) { res.status(404); throw new Error('Proyecto no encontrado'); }
  const isOwner = project.user.toString() === req.user.id;
  if (!isOwner) { res.status(401); throw new Error('No autorizado'); }
  await Task.deleteMany({ project: req.params.id });
  await project.deleteOne();
  res.status(200).json({ id: req.params.id });
});

// OBTENER TAREAS DE UN PROYECTO
const getTasksForProject = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) { res.status(404); throw new Error('Proyecto no encontrado'); }
    const isOwner = project.user.toString() === req.user.id;
    const isMember = await ProjectMember.exists({ project: project._id, user: req.user._id });
    if (!isOwner && !isMember) { res.status(404); throw new Error('Proyecto no encontrado o no autorizado'); }
    const tasks = await Task.find({ project: req.params.id })
      .sort({ createdAt: -1 })
      .populate('user', 'name email avatarUrl')
      .lean();
    res.status(200).json(tasks);
});

// CREAR TAREA PARA UN PROYECTO
const createTaskForProject = asyncHandler(async (req, res) => {
    const { title, dueInDays, dueDate } = req.body || {};
    const project = await Project.findById(req.params.id);
    if (!project) { res.status(404); throw new Error('Proyecto no encontrado'); }
    const isOwner = project.user.toString() === req.user.id;
    const isMember = await ProjectMember.exists({ project: project._id, user: req.user._id });
    if (!isOwner && !isMember) { res.status(404); throw new Error('Proyecto no encontrado o no autorizado'); }
    // calcular dueDate si corresponde
    let computedDueDate = undefined;
    if (dueDate) {
      const d = new Date(dueDate);
      if (!isNaN(d.getTime())) computedDueDate = d;
    } else if (Number.isFinite(Number(dueInDays))) {
      const days = Math.max(0, Number(dueInDays));
      computedDueDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    } else {
      // por defecto 7 días
      computedDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const task = await Task.create({
        title,
        project: req.params.id,
        user: req.user.id,
        status: 'Pendiente',
        dueDate: computedDueDate,
    });
    if (task && process.env.N8N_TASK_WEBHOOK_URL) {
        try {
            await axios.post(process.env.N8N_TASK_WEBHOOK_URL, {
                projectName: project.name,
                taskTitle: task.title,
                assignedToEmail: req.user.email,
                assignerName: req.user.name,
            });
        } catch (error) {
            console.error('Error al disparar webhook de tarea:', error.message);
        }
    }
    const withUser = await Task.findById(task._id).populate('user','name email avatarUrl');
    res.status(201).json(withUser);
});

// PUT /api/projects/:id/tasks/:taskId/status { status }
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  const allowed = new Set(['Pendiente','En Progreso','Completada','Cancelada']);
  if (!allowed.has(String(status))) { res.status(400); throw new Error('Estado no válido'); }

  const project = await Project.findById(req.params.id);
  if (!project) { res.status(404); throw new Error('Proyecto no encontrado'); }
  const isOwner = String(project.user) === String(req.user._id);
  const isMember = await ProjectMember.exists({ project: project._id, user: req.user._id });
  if (!isOwner && !isMember) { res.status(403); throw new Error('No autorizado'); }

  const task = await Task.findOne({ _id: req.params.taskId, project: project._id });
  if (!task) { res.status(404); throw new Error('Tarea no encontrada'); }
  task.status = status;
  await task.save();
  const withUser = await Task.findById(task._id).populate('user','name email avatarUrl');
  res.json(withUser);
});

// DELETE /api/projects/:id/tasks/:taskId
const deleteTask = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) { res.status(404); throw new Error('Proyecto no encontrado'); }
  const isOwner = String(project.user) === String(req.user._id);
  const isMember = await ProjectMember.exists({ project: project._id, user: req.user._id });
  if (!isOwner && !isMember) { res.status(403); throw new Error('No autorizado'); }

  const task = await Task.findOne({ _id: req.params.taskId, project: project._id });
  if (!task) { res.status(404); throw new Error('Tarea no encontrada'); }
  await task.deleteOne();
  res.status(204).send();
});

module.exports = {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getTasksForProject,
  createTaskForProject,
  updateTaskStatus,
  deleteTask,
};

// --- Invitaciones y colaboración ---
// POST /api/projects/:id/invite { email }
const inviteToProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) { res.status(404); throw new Error('Proyecto no encontrado'); }
  const isOwner = project.user.toString() === req.user.id;
  if (!isOwner) { res.status(403); throw new Error('Solo el propietario puede invitar'); }

  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) { res.status(400); throw new Error('Email requerido'); }
  const invitee = await User.findOne({ email });
  if (!invitee) { res.status(404); throw new Error('El usuario no existe'); }
  if (String(invitee._id) === String(req.user._id)) { res.status(400); throw new Error('No puedes invitarte a ti mismo'); }
  const alreadyMember = await ProjectMember.exists({ project: project._id, user: invitee._id });
  if (alreadyMember) { res.status(400); throw new Error('El usuario ya es miembro'); }
  if (String(project.user) === String(invitee._id)) { res.status(400); throw new Error('El usuario ya es el creador del proyecto'); }

  const pending = await ProjectInvitation.findOne({
    project: project._id,
    status: 'pending',
    $or: [ { inviteeUser: invitee._id }, { inviteeEmail: email } ],
  }).lean();
  if (pending) {
    res.status(409);
    throw new Error('Ya existe una invitación pendiente para este usuario');
  }

  const inv = await ProjectInvitation.create({ project: project._id, inviter: req.user._id, inviteeUser: invitee._id, inviteeEmail: email });

  await Notification.create({
    user: invitee._id,
    title: 'Invitación a proyecto',
    body: `${req.user.name} te ha invitado al proyecto "${project.name}"`,
    link: '/dashboard/projects/invitations',
    type: 'project_invite',
  });
  try {
    await sendMail({ to: email, subject: 'Invitación a proyecto', html: `<p>Has sido invitado al proyecto <b>${project.name}</b>.</p><p>Ingresa para aceptar o rechazar.</p>` });
  } catch {}

  res.status(201).json({ ok: true, invitationId: inv._id });
});

// GET /api/projects/invitations (pendientes del usuario)
const listMyInvitations = asyncHandler(async (req, res) => {
  const list = await ProjectInvitation.find({ status: 'pending', $or: [ { inviteeUser: req.user._id }, { inviteeEmail: req.user.email } ] })
    .populate('project', 'name')
    .populate('inviter', 'name email')
    .sort({ createdAt: -1 })
    .lean();
  res.json(list);
});

// POST /api/projects/invitations/:id/accept
const acceptInvitation = asyncHandler(async (req, res) => {
  const inv = await ProjectInvitation.findById(req.params.id);
  if (!inv || inv.status !== 'pending') { res.status(404); throw new Error('Invitación no encontrada'); }
  if (String(inv.inviteeUser || '') !== String(req.user._id) && inv.inviteeEmail !== req.user.email) {
    res.status(403); throw new Error('No autorizado');
  }
  await ProjectMember.updateOne({ project: inv.project, user: req.user._id }, { $setOnInsert: { role: 'member' } }, { upsert: true });
  inv.status = 'accepted'; await inv.save();
  try { await Notification.create({ user: inv.inviter, title: 'Invitación aceptada', body: `${req.user.name} se unió a tu proyecto`, type: 'project_invite' }); } catch {}
  res.json({ ok: true });
});

// POST /api/projects/invitations/:id/decline
const declineInvitation = asyncHandler(async (req, res) => {
  const inv = await ProjectInvitation.findById(req.params.id);
  if (!inv || inv.status !== 'pending') { res.status(404); throw new Error('Invitación no encontrada'); }
  if (String(inv.inviteeUser || '') !== String(req.user._id) && inv.inviteeEmail !== req.user.email) {
    res.status(403); throw new Error('No autorizado');
  }
  inv.status = 'declined'; await inv.save();
  try { await Notification.create({ user: inv.inviter, title: 'Invitación rechazada', body: `${req.user.name} rechazó la invitación`, type: 'project_invite' }); } catch {}
  res.json({ ok: true });
});

module.exports.inviteToProject = inviteToProject;
module.exports.listMyInvitations = listMyInvitations;
module.exports.acceptInvitation = acceptInvitation;
module.exports.declineInvitation = declineInvitation;
// tareas
module.exports.updateTaskStatus = updateTaskStatus;
module.exports.deleteTask = deleteTask;

// --- Detalle del proyecto (owner o miembro) ---
// GET /api/projects/:id
const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).lean();
  if (!project) { res.status(404); throw new Error('Proyecto no encontrado'); }
  const isOwner = String(project.user) === String(req.user._id);
  const isMember = await ProjectMember.exists({ project: project._id, user: req.user._id });
  if (!isOwner && !isMember) { res.status(404); throw new Error('Proyecto no encontrado o no autorizado'); }
  res.json(project);
});
module.exports.getProjectById = getProjectById;

// --- Miembros ---
// GET /api/projects/:id/members
const listProjectMembers = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) { res.status(404); throw new Error('Proyecto no encontrado'); }
  const isOwner = String(project.user) === String(req.user._id);
  const isMember = await ProjectMember.exists({ project: project._id, user: req.user._id });
  if (!isOwner && !isMember) { res.status(403); throw new Error('No autorizado'); }
  const members = await ProjectMember.find({ project: project._id })
    .populate('user', 'name email avatarUrl')
    .lean();
  // Incluir owner como miembro implícito al inicio
  const owner = await User.findById(project.user).select('name email avatarUrl').lean();
  const result = [{ role: 'owner', user: owner, _id: `owner_${owner?._id}` }, ...members.map(m => ({ ...m, role: 'member' }))];
  res.json(result);
});
module.exports.listProjectMembers = listProjectMembers;

// DELETE /api/projects/:id/members/:userId (solo owner, no puede quitarse a sí mismo del rol owner)
const removeProjectMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) { res.status(404); throw new Error('Proyecto no encontrado'); }
  const isOwner = String(project.user) === String(req.user._id);
  if (!isOwner) { res.status(403); throw new Error('Solo el propietario puede gestionar miembros'); }
  const userId = req.params.userId;
  if (String(userId) === String(project.user)) { res.status(400); throw new Error('No puedes eliminar al propietario'); }
  await ProjectMember.deleteOne({ project: project._id, user: userId });
  try { await Notification.create({ user: userId, title: 'Acceso revocado', body: `Se te ha quitado del proyecto "${project.name}"`, type: 'project_invite' }); } catch {}
  res.status(204).send();
});
module.exports.removeProjectMember = removeProjectMember;

// GET /api/projects/:id/stats
const getProjectStats = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) { res.status(404); throw new Error('Proyecto no encontrado'); }
  const isOwner = String(project.user) === String(req.user._id);
  const isMember = await ProjectMember.exists({ project: project._id, user: req.user._id });
  if (!isOwner && !isMember) { res.status(403); throw new Error('No autorizado'); }
  const membersCount = await ProjectMember.countDocuments({ project: project._id });
  let pendingInvites = 0;
  if (isOwner) pendingInvites = await ProjectInvitation.countDocuments({ project: project._id, status: 'pending' });
  res.json({ members: membersCount + 1, pending: pendingInvites });
});
module.exports.getProjectStats = getProjectStats;

// --- Invitaciones pendientes por proyecto (solo owner) ---
// GET /api/projects/:id/invitations
const listProjectInvitations = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) { res.status(404); throw new Error('Proyecto no encontrado'); }
  const isOwner = String(project.user) === String(req.user._id);
  if (!isOwner) { res.status(403); throw new Error('Solo el propietario puede ver las invitaciones'); }
  const invites = await ProjectInvitation.find({ project: project._id, status: 'pending' })
    .populate('inviteeUser', 'name email')
    .sort({ createdAt: -1 })
    .lean();
  res.json(invites);
});
module.exports.listProjectInvitations = listProjectInvitations;

// DELETE /api/projects/invitations/:id (cancelar) — solo owner del proyecto
const cancelProjectInvitation = asyncHandler(async (req, res) => {
  const inv = await ProjectInvitation.findById(req.params.id);
  if (!inv || inv.status !== 'pending') { res.status(404); throw new Error('Invitación no encontrada'); }
  const project = await Project.findById(inv.project).select('user name');
  if (!project) { res.status(404); throw new Error('Proyecto no encontrado'); }
  const isOwner = String(project.user) === String(req.user._id);
  if (!isOwner) { res.status(403); throw new Error('Solo el propietario puede cancelar invitaciones'); }
  inv.status = 'canceled';
  await inv.save();
  try {
    await Notification.create({ user: inv.inviteeUser, title: 'Invitación cancelada', body: `Se canceló tu invitación al proyecto "${project.name}"`, type: 'project_invite' });
  } catch {}
  res.status(204).send();
});
module.exports.cancelProjectInvitation = cancelProjectInvitation;

// --- Work link (documento de trabajo) ---
// GET /api/projects/:id/work-link
const getProjectWorkLink = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) { res.status(404); throw new Error('Proyecto no encontrado'); }
  const isOwner = String(project.user) === String(req.user._id);
  const isMember = await ProjectMember.exists({ project: project._id, user: req.user._id });
  if (!isOwner && !isMember) { res.status(403); throw new Error('No autorizado'); }
  const ProjectWorkLink = require('../models/projectWorkLinkModel');
  const doc = await ProjectWorkLink.findOne({ project: project._id }).lean();
  res.json({ url: doc?.url || '' });
});

// PUT /api/projects/:id/work-link { url }
const setProjectWorkLink = asyncHandler(async (req, res) => {
  const { url } = req.body || {};
  const project = await Project.findById(req.params.id);
  if (!project) { res.status(404); throw new Error('Proyecto no encontrado'); }
  const isOwner = String(project.user) === String(req.user._id);
  const isMember = await ProjectMember.exists({ project: project._id, user: req.user._id });
  if (!isOwner && !isMember) { res.status(403); throw new Error('No autorizado'); }
  if (typeof url !== 'string' || url.trim().length === 0) { res.status(400); throw new Error('URL requerida'); }
  const u = url.trim();
  const looksLikeHttp = /^https?:\/\//i.test(u);
  if (!looksLikeHttp) { res.status(400); throw new Error('La URL debe iniciar con http(s)://'); }
  const ProjectWorkLink = require('../models/projectWorkLinkModel');
  const doc = await ProjectWorkLink.findOneAndUpdate(
    { project: project._id },
    { $set: { url: u, addedBy: req.user._id } },
    { new: true, upsert: true }
  ).lean();
  res.json({ url: doc.url });
});

module.exports.getProjectWorkLink = getProjectWorkLink;
module.exports.setProjectWorkLink = setProjectWorkLink;

// --------- Recursos del proyecto (múltiples enlaces) ---------
// GET /api/projects/:id/links
const listProjectLinks = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) { res.status(404); throw new Error('Proyecto no encontrado'); }
  const isOwner = String(project.user) === String(req.user._id);
  const isMember = await ProjectMember.exists({ project: project._id, user: req.user._id });
  if (!isOwner && !isMember) { res.status(403); throw new Error('No autorizado'); }
  const links = await ProjectResourceLink.find({ project: project._id })
    .sort({ createdAt: -1 })
    .select('name url createdAt')
    .lean();
  res.json(links);
});

// POST /api/projects/:id/links { name, url }
const addProjectLink = asyncHandler(async (req, res) => {
  const { name, url } = req.body || {};
  const project = await Project.findById(req.params.id);
  if (!project) { res.status(404); throw new Error('Proyecto no encontrado'); }
  const isOwner = String(project.user) === String(req.user._id);
  const isMember = await ProjectMember.exists({ project: project._id, user: req.user._id });
  if (!isOwner && !isMember) { res.status(403); throw new Error('No autorizado'); }
  if (!name || !url) { res.status(400); throw new Error('Nombre y URL son requeridos'); }
  const u = String(url).trim();
  const n = String(name).trim();
  if (!/^https?:\/\//i.test(u)) { res.status(400); throw new Error('La URL debe iniciar con http(s)://'); }
  const link = await ProjectResourceLink.create({ project: project._id, name: n, url: u, addedBy: req.user._id });
  res.status(201).json({ _id: link._id, name: link.name, url: link.url, createdAt: link.createdAt });
});

// DELETE /api/projects/:id/links/:linkId
const deleteProjectLink = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) { res.status(404); throw new Error('Proyecto no encontrado'); }
  const isOwner = String(project.user) === String(req.user._id);
  const isMember = await ProjectMember.exists({ project: project._id, user: req.user._id });
  if (!isOwner && !isMember) { res.status(403); throw new Error('No autorizado'); }
  const link = await ProjectResourceLink.findOne({ _id: req.params.linkId, project: project._id });
  if (!link) { res.status(404); throw new Error('Recurso no encontrado'); }
  await link.deleteOne();
  res.status(204).send();
});

module.exports.listProjectLinks = listProjectLinks;
module.exports.addProjectLink = addProjectLink;
module.exports.deleteProjectLink = deleteProjectLink;
