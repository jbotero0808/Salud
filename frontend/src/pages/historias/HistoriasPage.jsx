import { useEffect, useState } from 'react';
import api from '../../services/api';
import PacienteListaLateral from './PacienteListaLateral';
import HistoriaForm from './HistoriaForm';
import HistorialColumna from './HistorialColumna';

export default function HistoriasPage() {
  const [paciente, setPaciente] = useState(null);
  const [historias, setHistorias] = useState([]);
  const [cargandoHistorias, setCargandoHistorias] = useState(false);

  const cargarHistorias = async (pacienteId) => {
    if (!pacienteId) { setHistorias([]); return; }
    setCargandoHistorias(true);
    try {
      const { data } = await api.get(`/historias/paciente/${pacienteId}`);
      setHistorias(data);
    } finally {
      setCargandoHistorias(false);
    }
  };

  useEffect(() => { cargarHistorias(paciente?.id); }, [paciente]); // eslint-disable-line react-hooks/exhaustive-deps

  const guardar = async (form) => {
    await api.post('/historias', { ...form, paciente_id: paciente.id });
    cargarHistorias(paciente.id);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Historia Clínica</h1>
      </div>

      <div className="historia-layout">
        <PacienteListaLateral
          pacienteSeleccionadoId={paciente?.id}
          onSeleccionar={setPaciente}
        />

        <fieldset className="fieldset-box fieldset-box--tall">
          <legend>{paciente ? paciente.nombre : 'Nombre del paciente'}</legend>
          {paciente ? (
            <HistoriaForm onGuardar={guardar} />
          ) : (
            <p>Selecciona un paciente en la lista de la izquierda para registrar una evolución.</p>
          )}
        </fieldset>

        <HistorialColumna historias={historias} cargando={cargandoHistorias} paciente={paciente} />
      </div>
    </div>
  );
}
