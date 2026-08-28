const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');

const { pool } = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const pacientesRoutes = require('./routes/pacientes.routes');
const citasRoutes = require('./routes/citas.routes');
const historiasRoutes = require('./routes/historias.routes');
const tablaMaestraRoutes = require('./routes/tablaMaestra.routes');
const auditoriaRoutes = require('./routes/auditoria.routes');
const { manejadorErrores } = require('./middleware/error.middleware');

const app = express();

// Vercel entrega la petición a través de su propio proxy/edge; sin esto,
// express-rate-limit vería siempre la IP del proxy en vez de la del
// cliente real (y además lanza un error de validación al detectar
// X-Forwarded-For con trust proxy sin configurar).
app.set('trust proxy', 1);

app.use(helmet());

// Falla cerrado, no abierto: si CORS_ORIGIN no está definida, no se
// permite ningún origen cross-origin en vez de aceptar cualquiera ('*').
// Un despliegue mal configurado debe romperse de forma visible, no
// quedar abierto a cualquier sitio silenciosamente.
if (!process.env.CORS_ORIGIN) {
  console.warn('⚠️  CORS_ORIGIN no está definida — se bloquearán todas las peticiones cross-origin.');
}
// credentials:true es obligatorio para que el navegador envíe/reciba las
// cookies de sesión entre el frontend y el backend (dominios distintos de
// Vercel). No es compatible con origin:'*' — por eso CORS_ORIGIN debe ser
// una URL exacta, nunca un comodín.
app.use(cors({ origin: process.env.CORS_ORIGIN || false, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '8mb' })); // las evoluciones pueden incluir imágenes en base64
app.use(morgan('dev'));

// Cada despliegue se conecta a la base de datos de un único cliente
// (una base de datos por tenant), así que basta con exponer el pool
// compartido en cada petición — no hay cambio de esquema que resolver.
app.use((req, res, next) => {
  req.db = pool;
  next();
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/historias', historiasRoutes);
app.use('/api/tabla-maestra', tablaMaestraRoutes);
app.use('/api/auditoria', auditoriaRoutes);

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use(manejadorErrores);

module.exports = app;
