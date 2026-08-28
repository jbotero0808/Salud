async function listar(req, res, next) {
  const limite = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const desplazamiento = parseInt(req.query.offset, 10) || 0;

  try {
    const { rows } = await req.db.query(
      `SELECT a.id, a.accion, a.entidad, a.entidad_id, a.detalle, a.ip, a.fecha, m.correo AS medico_correo
         FROM public.auditoria a
    LEFT JOIN public.medicos m ON m.id = a.medico_id
        ORDER BY a.fecha DESC
        LIMIT $1 OFFSET $2`,
      [limite, desplazamiento]
    );
    const { rows: totalRows } = await req.db.query(`SELECT COUNT(*) AS total FROM public.auditoria`);
    res.json({ items: rows, total: Number(totalRows[0].total) });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
