// backend/controllers/userController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Generar un JSON Web Token
// @access  Privado
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

 
// @desc    Registrar un nuevo usuario
// @route   POST /api/users
// @access  Público
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Verificar que todos los campos estén completos
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Por favor, completa todos los campos');
  }

  // Verificar si el usuario ya existe
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('El usuario ya está registrado');
  }

  // Generar el salt y hashear la contraseña
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
  const salt = await bcrypt.genSalt(Number.isFinite(rounds) ? rounds : 10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Determinar rol solicitado (permitir 'admin' solo con clave válida)
  const requestedRole = req.body && req.body.role === 'admin' ? 'admin' : 'user';
  let finalRole = 'user';
  if ((req.body && req.body.role) === 'admin') {
    const providedKey = String((req.body && req.body.adminKey) || '');
    const secret = process.env.ADMIN_CREATION_SECRET || 'Jenkins2025';
    if (providedKey === secret) {
      finalRole = 'admin';
    }
  } else if (['investigador', 'estudiante', 'user'].includes(String(req.body?.role || '').toLowerCase())) {
    finalRole = String(req.body.role).toLowerCase();
  }

  // Crear el usuario en la base de datos
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: finalRole,
  });

  // Si el usuario se creó correctamente, enviar los datos y el token
  if (user) {
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl || null,
      token: generateToken(user.id),
    });
  } else {
    res.status(400);
    throw new Error('Datos de usuario inválidos');
  }
});

// @desc    Autenticar (login) un usuario
// @route   POST /api/users/login
// @access  Público
const loginUser = asyncHandler(async (req, res) => {
  // 1. Obtenemos el email y password del body
  const { email, password } = req.body;

  // 2. Buscamos al usuario por su email
  const user = await User.findOne({ email });

  // 3. Si el usuario existe Y la contraseña coincide...
  // bcrypt.compare se encarga de comparar el texto plano con el hash
  if (user && (await bcrypt.compare(password, user.password))) {
    // 4. ...enviamos los datos del usuario y un nuevo token
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl || null,
      token: generateToken(user.id),
    });
  } else {
    // 5. Si no, enviamos un error de credenciales inválidas
    res.status(401); // 401 = Unauthorized
    throw new Error('Email o contraseña inválidos');
  }
});

 
// @desc    Obtener perfil del usuario autenticado
// @route   GET /api/users/me
// @access  Privado
const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// @desc    Eliminar cuenta del usuario (LPDP - derecho de supresión)
// @route   DELETE /api/users/me
// @access  Privado
const deleteMe = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  await Promise.all([
    require('../models/projectModel').deleteMany({ user: userId }),
    require('../models/taskModel').deleteMany({ user: userId }),
    require('../models/libraryItemModel').deleteMany({ user: userId }),
  ]);

  await User.deleteOne({ _id: userId });

  return res.status(204).send();
});


module.exports = {
  registerUser,
  loginUser, // Se añade la nueva función a las exportaciones
};
