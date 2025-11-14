// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/userController');
const { forgotPassword, resetPassword } = require('../controllers/passwordController');

router.post('/register', registerUser);
router.post('/login', loginUser); // <--- AÃ±ade esta nueva ruta

// Privacidad y derechos del usuario (LPDP)
const { getMe, deleteMe, updateMe, checkEmailUnique } = require('../controllers/privacyController');
const { updateAvatar } = require('../controllers/avatarController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.delete('/me', protect, deleteMe);
router.get('/check-email', protect, checkEmailUnique);
router.put('/me/avatar', protect, upload.single('avatar'), updateAvatar);

// Recuperación de contraseña
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
