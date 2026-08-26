async function listarPorTipo(req, res, next) {
  try {
    const { rows } = await req.db.query(
      `SELECT id, nombre, tipo FROM tabla_maestra WHERE tipo = $1 AND activo = 's' ORDER BY nombre`,
      [req.params.tipo]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { listarPorTipo };
