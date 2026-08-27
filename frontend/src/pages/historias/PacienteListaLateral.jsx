import { useEffect, useState } from 'react';
import api from '../../services/api';
import AvatarPaciente from '../../components/AvatarPaciente';

export default function PacienteListaLateral({ pacienteSeleccionadoId, onSeleccionar }) {
  const [busqueda, setBusqueda] = useState('');
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCargando(true);
      api.get('/pacientes', { params: busqueda ? { q: busqueda } : {} })
        .then((r) => setPacientes(r.data))
        .finally(() => setCargando(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [busqueda]);

  return (
    <fieldset className="fieldset-box fieldset-box--tall">
      <legend>Paciente</legend>

      <div className="form-group">
        <label>Buscar</label>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Nombre o cédula..."
        />
      </div>

      <div className="paciente-lista-scroll">
        {cargando && <p>Cargando...</p>}
        {!cargando && pacientes.length === 0 && <p>No se encontraron pacientes activos.</p>}
        {pacientes.map((p) => (
          <div
            key={p.id}
            className={`paciente-item ${pacienteSeleccionadoId === p.id ? 'is-selected' : ''}`}
            onClick={() => onSeleccionar(p)}
          >
            <AvatarPaciente paciente={p} />
            <div>
              <div><strong>Nombre:</strong> {p.nombre}</div>
              <div><strong>Celular:</strong> {p.celular || '—'}</div>
              <div><strong>Correo:</strong> {p.correo || '—'}</div>
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
