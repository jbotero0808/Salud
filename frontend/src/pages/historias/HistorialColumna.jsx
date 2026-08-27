import HistorialEntry from './HistorialEntry';

export default function HistorialColumna({ historias, cargando, paciente }) {
  return (
    <fieldset className="fieldset-box fieldset-box--tall">
      <legend>Historial</legend>

      {cargando && <p>Cargando...</p>}
      {!cargando && historias.length === 0 && <p>Este paciente aún no tiene evoluciones registradas.</p>}

      <div className="paciente-lista-scroll">
        {historias.map((h) => (
          <HistorialEntry key={h.id} historia={h} paciente={paciente} />
        ))}
      </div>
    </fieldset>
  );
}
