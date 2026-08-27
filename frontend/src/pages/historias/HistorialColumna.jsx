export default function HistorialColumna({ historias, cargando }) {
  return (
    <fieldset className="fieldset-box fieldset-box--tall">
      <legend>Historial</legend>

      {cargando && <p>Cargando...</p>}
      {!cargando && historias.length === 0 && <p>Este paciente aún no tiene evoluciones registradas.</p>}

      <div className="paciente-lista-scroll">
        {historias.map((h) => (
          <fieldset key={h.id} className="fieldset-box fieldset-box--entry">
            <legend>{new Date(h.fecha).toLocaleDateString()}</legend>
            {h.tipo_consulta && <div><strong className="text-primary">Tipo:</strong> {h.tipo_consulta}</div>}
            {h.observaciones && <div style={{ marginTop: 4 }}>{h.observaciones}</div>}
            {h.tratamiento && (
              <div style={{ marginTop: 4 }}><strong className="text-primary">Tratamiento:</strong> {h.tratamiento}</div>
            )}
            {h.imagen_url && (
              <img src={h.imagen_url} alt="Adjunto" className="historial-entry-img" />
            )}
          </fieldset>
        ))}
      </div>
    </fieldset>
  );
}
