const express = require('express');
const colors = require('colors');
const dotenv = require('dotenv').config();
const { errorHandler } = require('./middleware/errorMiddleware');
const connectDB = require('./config/db');
const path = require('path');
const compression = require('compression');
const responseTime = require('response-time');

connectDB();
const app = express();

// Confiar en el proxy (Nginx/Load Balancer) para detectar HTTPS correctamente
app.enable('trust proxy');

// Logger simple (colocar temprano en la cadena de middlewares)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Forzar HTTPS en producción si ENFORCE_HTTPS=true
app.use((req, res, next) => {
  const enforce = String(process.env.ENFORCE_HTTPS || 'false').toLowerCase() === 'true';
  if (enforce && req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    // Evitar downgrades en métodos sensibles
  }
  if (enforce && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    const host = req.headers.host;
    return res.redirect(301, `https://${host}${req.originalUrl}`);
  }
  return next();
});

// Cabeceras de seguridad mínimas
app.use((req, res, next) => {
  // HSTS (solo tiene efecto sobre HTTPS)
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  // CSP básica y conservadora para API; el frontend (SPA) puede necesitar su propia CSP en Nginx
  // res.setHeader('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none'");
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin/users', require('./routes/adminUserRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/library', require('./routes/libraryRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin/metrics', require('./routes/adminMetricsRoutes'));
app.use('/api/metrics', require('./routes/metricsRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/superadmin', require('./routes/superAdminRoutes'));
// Archivos estáticos subidos (avatares)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Endpoints de salud para orquestadores / balanceadores
app.get('/healthz', (req, res) => res.status(200).send('ok'));
app.get('/readyz', (req, res) => {
  try {
    const mongoose = require('mongoose');
    const ready = mongoose.connection && mongoose.connection.readyState === 1; // connected
    if (ready) return res.status(200).send('ready');
    return res.status(503).send('not-ready');
  } catch {
    return res.status(200).send('ready');
  }
});

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../gestion-proyectos-frontend/build')));
    app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, '../', 'gestion-proyectos-frontend', 'build', 'index.html')));
} else {
    app.get('/', (req, res) => res.send('API corriendo en modo de desarrollo'));
}

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Servidor iniciado en el puerto ${PORT}`.cyan.underline));

// Apagado elegante para alta disponibilidad (K8s SIGTERM)
process.on('SIGTERM', async () => {
  console.log('Recibido SIGTERM. Cerrando servidor...');
  server.close(async () => {
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection && mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }
    } catch {}
    process.exit(0);
  });
});
app.use(compression());
app.use(responseTime((req, res, time) => {
  // Log de lentitud para trazabilidad de objetivos HU11
  if (time > 2000) {
    console.warn(`SLOW ${req.method} ${req.originalUrl} - ${Math.round(time)}ms`);
  }
}));
