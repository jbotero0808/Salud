import { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import PacienteForm from './PacienteForm';

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(null); // null | 'nuevo' | paciente
  const [error, setError] = useState('');

  const cargar = async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/pacientes');
      setPacientes(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar pacientes');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async (form) => {
    if (editando === 'nuevo') {
      await api.post('/pacientes', form);
    } else {
      await api.put(`/pacientes/${editando.id}`, form);
    }
    setEditando(null);
    cargar();
  };

  const eliminar = async (paciente) => {
    if (!window.confirm(`¿Eliminar a ${paciente.nombre}?`)) return;
    await api.delete(`/pacientes/${paciente.id}`);
    cargar();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Pacientes</h1>
        <button className="btn btn-primary" onClick={() => setEditando('nuevo')}>+ Nuevo paciente</button>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <div className="card table-wrapper">
        {cargando ? (
          <p>Cargando...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th><th>Cédula</th><th>Celular</th><th>Correo</th><th></th>
              </tr>
            </thead>
            <tbody>
              {pacientes.map((p) => (
                <tr key={p.id}>
                  <td>{p.nombre}</td>
                  <td>{p.cedula}</td>
                  <td>{p.celular}</td>
                  <td>{p.correo}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" onClick={() => setEditando(p)}>Editar</button>
                    <button className="btn btn-danger" onClick={() => eliminar(p)}>Eliminar</button>
                  </td>
                </tr>
              ))}
              {pacientes.length === 0 && (
                <tr><td colSpan={5}>No hay pacientes registrados.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {editando && (
        <Modal titulo={editando === 'nuevo' ? 'Nuevo paciente' : 'Editar paciente'} onClose={() => setEditando(null)}>
          <PacienteForm
            inicial={editando === 'nuevo' ? null : editando}
            onGuardar={guardar}
            onCancelar={() => setEditando(null)}
          />
        </Modal>
      )}
    </div>
  );
}
