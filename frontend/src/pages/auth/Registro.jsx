import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SelectorPaleta from '../../components/SelectorPaleta';
import { COLOR_POR_DEFECTO } from '../../theme/paletas';

const ESTADO_INICIAL = {
  nombre: '',
  correo: '',
  password: '',
  celular: '',
  documento_identidad: '',
  foto_logo_url: '',
  empresa: '',
  color_primario: COLOR_POR_DEFECTO,
};

export default function Registro() {
  const { registrar } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(ESTADO_INICIAL);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const actualizarCampo = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await registrar(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'No fue posible completar el registro');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>Crear cuenta profesional</h1>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre completo</label>
            <input value={form.nombre} onChange={actualizarCampo('nombre')} required />
          </div>
          <div className="form-group">
            <label>Correo</label>
            <input type="email" value={form.correo} onChange={actualizarCampo('correo')} required />
          </div>
          <div className="form-group">
            <label>Contraseña (mín. 8 caracteres)</label>
            <input type="password" minLength={8} value={form.password} onChange={actualizarCampo('password')} required />
          </div>
          <div className="form-group">
            <label>Documento de identidad</label>
            <input value={form.documento_identidad} onChange={actualizarCampo('documento_identidad')} required />
          </div>
          <div className="form-group">
            <label>Celular</label>
            <input value={form.celular} onChange={actualizarCampo('celular')} />
          </div>
          <div className="form-group">
            <label>Empresa</label>
            <input value={form.empresa} onChange={actualizarCampo('empresa')} placeholder="Nombre de tu consultorio o empresa" />
          </div>
          <div className="form-group">
            <label>URL de foto / logo (opcional)</label>
            <input value={form.foto_logo_url} onChange={actualizarCampo('foto_logo_url')} placeholder="https://..." />
          </div>
          <div className="form-group">
            <SelectorPaleta valor={form.color_primario} onChange={(color) => setForm({ ...form, color_primario: color })} />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={enviando}>
            {enviando ? 'Creando cuenta...' : 'Registrarme'}
          </button>
        </form>
        <div className="auth-switch">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}
