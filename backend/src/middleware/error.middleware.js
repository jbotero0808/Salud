function manejadorErrores(err, req, res, next) {
  console.error(err);

  if (err.code === '23505') {
    return res.status(409).json({ error: 'El registro ya existe (violación de restricción única)' });
  }
  if (err.code === '23503') {
    return res.status(409).json({ error: 'Referencia inválida a un recurso relacionado' });
  }

  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
}

module.exports = { manejadorErrores };
