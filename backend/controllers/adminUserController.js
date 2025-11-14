// backend/controllers/adminUserController.js
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const Project = require('../models/projectModel');
const Task = require('../models/taskModel');
const LibraryItem = require('../models/libraryItemModel');
const AuditLog = require('../models/auditLogModel');

const allowedRoles = new Set(['superadmin', 'admin', 'investigador', 'estudiante', 'user']);

// GET /api/admin/users
const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}, '-password').sort({ createdAt: -1 });
  res.json(users);
});

// GET /api/admin/users/:id
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    res.status(404);
    throw new Error('Usuario no encontrado');
  }
  res.json(user);
});

// POST /api/admin/users
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'user' } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Nombre, email y contrasena son obligatorios');
  }

  if (role && !allowedRoles.has(role)) {
    res.status(400);
    throw new Error('Rol no valido');
  }
  // Solo un superadmin puede crear otro superadmin
  if (role === 'superadmin' && req.user?.role !== 'superadmin') {
    res.status(403);
    throw new Error('Solo un superadmin puede crear otro superadmin');
  }

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error('El email ya esta registrado');
  }

  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
  const salt = await bcrypt.genSalt(Number.isFinite(rounds) ? rounds : 10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({ name, email, password: hashedPassword, role });
  res.status(201).json({ _id: user.id, name: user.name, email: user.email, role: user.role });
});

// PUT /api/admin/users/:id
const updateUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('Usuario no encontrado');
  }

  if (email && email !== user.email) {
    const emailTaken = await User.findOne({ email });
    if (emailTaken) {
      res.status(400);
      throw new Error('El email ya esta en uso');
    }
    user.email = email;
  }

  const prevRole = user.role;
  // No permitir que un admin cambie/elimine a un superadmin
  if (prevRole === 'superadmin' && req.user?.role !== 'superadmin') {
    res.status(403);
    throw new Error('No permitido sobre superadmin');
  }
  if (name) user.name = name;
  if (typeof role === 'string') {
    if (!allowedRoles.has(role)) {
      res.status(400);
      throw new Error('Rol no valido');
    }
    if (role === 'superadmin' && req.user?.role !== 'superadmin') {
      res.status(403);
      throw new Error('Solo un superadmin puede asignar el rol superadmin');
    }
    user.role = role;
  }

  if (password) {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
    const salt = await bcrypt.genSalt(Number.isFinite(rounds) ? rounds : 10);
    user.password = await bcrypt.hash(password, salt);
  }

  await user.save();

  if (typeof role === 'string' && role !== prevRole) {
    await AuditLog.create({
      actor: req.user?._id,
      targetUser: user._id,
      action: 'role_change',
      oldRole: prevRole,
      newRole: role,
      ip: req.ip,
    });
  }

  res.json({ _id: user.id, name: user.name, email: user.email, role: user.role });
});

// DELETE /api/admin/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  const exists = await User.findById(userId);
  if (!exists) {
    res.status(404);
    throw new Error('Usuario no encontrado');
  }
  if (exists.role === 'superadmin' && req.user?.role !== 'superadmin') {
    res.status(403);
    throw new Error('No permitido eliminar un superadmin');
  }

  await Promise.all([
    Project.deleteMany({ user: userId }),
    Task.deleteMany({ user: userId }),
    LibraryItem.deleteMany({ user: userId }),
  ]);

  await User.deleteOne({ _id: userId });
  res.status(204).send();
});

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
