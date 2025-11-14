// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // El token se envía en los headers de la petición así: "Bearer TOKEN_AQUI"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 1. Obtenemos el token del header
      token = req.headers.authorization.split(' ')[1];

      // 2. Verificamos el token con nuestro secreto
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Obtenemos los datos del usuario desde la BBDD usando el ID del token
      // y lo adjuntamos al objeto 'req' para que las rutas protegidas tengan acceso a él.
      // Excluimos la contraseña.
      req.user = await User.findById(decoded.id).select('-password');

      next(); // Pasamos al siguiente middleware o controlador
    } catch (error) {
      console.error(error);
      res.status(401); // No autorizado
      throw new Error('No autorizado, token falló');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('No autorizado, no se encontró token');
  }
});

// Middleware para validar roles específicos
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('No autorizado');
    }
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error('Prohibido: rol insuficiente');
    }
    next();
  };
};

module.exports = { protect, authorize };
