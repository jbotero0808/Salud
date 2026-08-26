const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const pacientesRoutes = require('./routes/pacientes.routes');
const citasRoutes = require('./routes/citas.routes');
const historiasRoutes = require('./routes/historias.routes');
const tablaMaestraRoutes = require('./routes/tablaMaestra.routes');
const { manejadorErrores } = require('./middleware/error.middleware');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '8mb' })); // las evoluciones pueden incluir imágenes en base64
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/historias', historiasRoutes);
app.use('/api/tabla-maestra', tablaMaestraRoutes);

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use(manejadorErrores);

module.exports = app;
