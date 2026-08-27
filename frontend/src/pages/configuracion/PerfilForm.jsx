import { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import SelectorPaleta from '../../components/SelectorPaleta';
import { archivoABase64 } from '../../utils/archivo';

export default function PerfilForm() {
  const { medico, actualizarMedico } = useAuth();
  const [nombre, setNombre] = useState(medico?.nombre || '');
  const [profesion, setProfesion] = useState(medico?.profesion || '');
  const [fotoLogoUrl, setFotoLogoUrl] = useState(medico?.foto_logo_url || '');
  const [colorPrimario, setColorPrimario] = useState(medico?.color_primario || 'azul');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const inputArchivoRef = useRef(null);

  const handleArchivo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await archivoABase64(file);
    setFotoLogoUrl(base64);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExito(false);
    setGuardando(true);
    try {
      const { data } = await api.put('/auth/perfil', {
        nombre,
        profesion,
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
        <label>Profesión</label>
        <input
          value={profesion}
          onChange={(e) => setProfesion(e.target.value)}
          placeholder="Fisioterapeuta, Médico, Odontólogo..."
        />
      </div>

      <div className="form-group">
        <label>Logo</label>
        <div
          className="image-upload-box"
          onClick={() => inputArchivoRef.current?.click()}
        >
          {fotoLogoUrl ? <img src={fotoLogoUrl} alt="Logo" /> : <span>📷</span>}
        </div>
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
          Clic para {fotoLogoUrl ? 'cambiar' : 'cargar'} imagen
        </div>
        {fotoLogoUrl && (
          <div style={{ textAlign: 'center' }}>
            <button type="button" className="btn btn-secondary" style={{ marginTop: 8, padding: '4px 12px', fontSize: 12 }} onClick={() => setFotoLogoUrl('')}>
              Quitar imagen
            </button>
          </div>
        )}
        <input
          ref={inputArchivoRef}
          type="file"
          accept="image/*"
          onChange={handleArchivo}
          style={{ display: 'none' }}
        />
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
