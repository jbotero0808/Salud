import { useEffect, useState } from 'react';
import api from '../../services/api';

const LIMITE = 50;

const ETIQUETAS_ACCION = {
  LOGIN_EXITOSO: 'Inicio de sesión',
  LOGIN_FALLIDO: 'Intento de inicio de sesión fallido',
  CREAR: 'Creó',
  VER: 'Consultó',
  ACTUALIZAR: 'Actualizó',
  ELIMINAR: 'Eliminó',
};

export default function AuditoriaPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [cargando, setCargando] = useState(true);

  const cargar = async (nuevoOffset) => {
    setCargando(true);
    try {
      const { data } = await api.get('/auditoria', { params: { limit: LIMITE, offset: nuevoOffset } });
      setItems((prev) => (nuevoOffset === 0 ? data.items : [...prev, ...data.items]));
      setTotal(data.total);
      setOffset(nuevoOffset);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(0); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="page-header">
        <h1>Auditoría</h1>
      </div>

      <div className="card table-wrapper">
        {cargando && items.length === 0 ? (
          <p>Cargando...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fecha</th><th>Acción</th><th>Entidad</th><th>Detalle</th><th>Usuario</th><th>IP</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.fecha).toLocaleString()}</td>
                  <td>{ETIQUETAS_ACCION[item.accion] || item.accion}</td>
                  <td>{item.entidad}{item.entidad_id ? ` #${item.entidad_id}` : ''}</td>
                  <td>{item.detalle || '—'}</td>
                  <td>{item.medico_correo || '—'}</td>
                  <td>{item.ip || '—'}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={6}>Aún no hay eventos registrados.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {items.length < total && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button className="btn btn-secondary" onClick={() => cargar(offset + LIMITE)} disabled={cargando}>
            {cargando ? 'Cargando...' : `Cargar más (${items.length} de ${total})`}
          </button>
        </div>
      )}
    </div>
  );
}
