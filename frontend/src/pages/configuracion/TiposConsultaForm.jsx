import { useEffect, useState } from 'react';
import api from '../../services/api';

const TIPO = 'tipoConsulta';

export default function TiposConsultaForm() {
  const [tipos, setTipos] = useState([]);
  const [nombre, setNombre] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cargar = async () => {
    setCargando(true);
    try {
      const { data } = await api.get(`/tabla-maestra/${TIPO}`);
      setTipos(data);
    } catch {
      setError('No fue posible cargar los tipos de consulta');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const agregar = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setError('');
    setGuardando(true);
    try {
      await api.post('/tabla-maestra', { nombre: nombre.trim(), tipo: TIPO });
      setNombre('');
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'No fue posible agregar el tipo de consulta');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id) => {
    setError('');
    try {
      await api.delete(`/tabla-maestra/${id}`);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'No fue posible eliminar el tipo de consulta');
    }
  };

  return (
    <div className="card">
      <h2 className="text-primary" style={{ marginTop: 0 }}>Tipos de consulta</h2>
      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={agregar} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nuevo tipo de consulta..."
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary" type="submit" disabled={guardando || !nombre.trim()}>
          {guardando ? 'Agregando...' : 'Agregar'}
        </button>
      </form>

      {cargando ? (
        <p>Cargando...</p>
      ) : tipos.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No hay tipos de consulta registrados.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
          {tipos.map((t) => (
            <li key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--primary-color-light)', borderRadius: 8, padding: '8px 12px' }}>
              <span>{t.nombre}</span>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '4px 12px', fontSize: 12 }}
                onClick={() => eliminar(t.id)}
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
