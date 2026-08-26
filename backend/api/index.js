// Punto de entrada para el runtime serverless de Vercel. Un app de
// Express es en sí misma una función (req, res) => {...}, así que
// exportarla directamente es válido como función de Vercel.
// (El servidor tradicional con app.listen sigue viviendo en
// src/server.js, usado solo para desarrollo local con `npm run dev`.)
require('dotenv').config();

const app = require('../src/app');

module.exports = app;
