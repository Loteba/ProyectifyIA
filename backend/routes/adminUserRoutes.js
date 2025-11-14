// backend/routes/adminUserRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/adminUserController');

// Todas las rutas requieren admin o superadmin
router.use(protect, authorize('admin','superadmin'));

router.get('/', listUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
