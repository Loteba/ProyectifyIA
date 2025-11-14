// backend/models/taskModel.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Project',
  },
  // Por ahora, la tarea es creada por el usuario del proyecto.
  // En el futuro, se podría asignar a otros miembros del equipo.
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  title: {
    type: String,
    required: [true, 'Por favor, introduce un título para la tarea'],
  },
  status: {
    type: String,
    required: true,
    enum: ['Pendiente', 'En Progreso', 'Completada', 'Cancelada'],
    default: 'Pendiente',
  },
  // Fecha límite de la tarea (opcional). Se puede asignar por defecto a N días.
  dueDate: { type: Date },
}, {
  timestamps: true,
});

// Índices de rendimiento
taskSchema.index({ project: 1, createdAt: -1 });
taskSchema.index({ user: 1, createdAt: -1 });
taskSchema.index({ dueDate: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);
