import { useEffect, useState } from 'react';
import api from '../../services/api';

function aFechaLocalInput(fecha) {
  const d = new Date(fecha);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CitaForm({ inicial, fechaSugerida, onGuardar, onCancelar }) {
  const [pacientes, setPacientes] = useState([]);
  const [pacienteId, setPacienteId] = useState(inicial?.paciente_id || '');
  const [fechaInicio, setFechaInicio] = useState(
    aFechaLocalInput(inicial?.fecha_inicio || fechaSugerida || new Date())
  );
  const [duracionHoras, setDuracionHoras] = useState(1);
  const [estado, setEstado] = useState(inicial?.estado || 'programada');
  const [notas, setNotas] = useState(inicial?.notas || '');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.get('/pacientes').then((r) => setPacientes(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const inicio = new Date(fechaInicio);
      const fin = new Date(inicio.getTime() + duracionHoras * 60 * 60 * 1000);
      await onGuardar({
        paciente_id: pacienteId,
        fecha_inicio: inicio.toISOString(),
        fecha_fin: fin.toISOString(),
        estado,
        notas,
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Paciente</label>
        <select value={pacienteId} onChange={(e) => setPacienteId(e.target.value)} required>
          <option value="">Seleccionar paciente...</option>
          {pacientes.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Fecha y hora de inicio</label>
        <input type="datetime-local" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Duración (horas)</label>
        <input type="number" min="0.5" step="0.5" value={duracionHoras} onChange={(e) => setDuracionHoras(Number(e.target.value))} />
      </div>
      <div className="form-group">
        <label>Estado</label>
        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="programada">Programada</option>
          <option value="confirmada">Confirmada</option>
          <option value="completada">Completada</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>
      <div className="form-group">
        <label>Notas</label>
        <textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancelar}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar cita'}
        </button>
      </div>
    </form>
  );
}
