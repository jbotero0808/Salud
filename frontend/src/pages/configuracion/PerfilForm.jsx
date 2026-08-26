import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import SelectorPaleta from '../../components/SelectorPaleta';

export default function PerfilForm() {
  const { medico, actualizarMedico } = useAuth();
  const [nombre, setNombre] = useState(medico?.nombre || '');
  const [fotoLogoUrl, setFotoLogoUrl] = useState(medico?.foto_logo_url || '');
  const [colorPrimario, setColorPrimario] = useState(medico?.color_primario || 'azul');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExito(false);
    setGuardando(true);
    try {
      const { data } = await api.put('/auth/perfil', {
        nombre,
        foto_logo_url: fotoLogoUrl || null,
        color_primario: colorPrimario,
      });
      actualizarMedico(data.medico);
      setExito(true);
    } catch (err) {
      setError(err.response?.data?.error || 'No fue posible guardar los cambios');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2 className="text-primary" style={{ marginTop: 0 }}>Perfil</h2>
      {error && <div className="auth-error">{error}</div>}
      {exito && <div style={{ color: 'var(--primary-color-dark)', marginBottom: 12, fontSize: 14 }}>Cambios guardados.</div>}

      <div className="form-group">
        <label>Nombre</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
      </div>

      <div className="form-group">
        <label>URL de foto / logo</label>
        <input value={fotoLogoUrl} onChange={(e) => setFotoLogoUrl(e.target.value)} placeholder="https://..." />
      </div>

      <div className="form-group">
        <SelectorPaleta valor={colorPrimario} onChange={setColorPrimario} />
      </div>

      <button className="btn btn-primary" type="submit" disabled={guardando}>
        {guardando ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  );
}
