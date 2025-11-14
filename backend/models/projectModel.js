const mongoose = require('mongoose');

const projectSchema = mongoose.Schema(
    {
        user: { // Volvemos a usar 'user' en lugar de 'owner'
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        name: {
            type: String,
            required: [true, 'Por favor, añade un nombre al proyecto'],
        },
        description: {
            type: String,
            required: [true, 'Por favor, añade una descripción'],
        },
        areaTematica: {
            type: String,
            required: [true, 'Por favor, añade un área temática'],
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Project', projectSchema);
// Índice para usuario y fecha de creación
projectSchema.index({ user: 1, createdAt: -1 });
