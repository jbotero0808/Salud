import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { aplicarPaleta } from '../theme/paletas';
import { aplicarFavicon } from '../theme/favicon';
import { aplicarTitulo } from '../theme/documentTitle';
import { fijarCsrfToken } from '../services/csrfStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // La sesión real vive en una cookie httpOnly (invisible para JS); esto
  // solo cachea datos de exhibición (nombre, logo, color) para pintar la
  // UI al instante mientras se confirma la sesión contra el backend.
  const [medico, setMedico] = useState(() => {
    const guardado = localStorage.getItem('salud_medico');
    return guardado ? JSON.parse(guardado) : null;
  });
  const [modulos, setModulos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const persistirSesion = (medicoData) => {
    localStorage.setItem('salud_medico', JSON.stringify(medicoData));
    setMedico(medicoData);
    aplicarPaleta(medicoData.color_primario);
    aplicarFavicon(medicoData.foto_logo_url);
    aplicarTitulo(medicoData.empresa);
  };

  const login = async (correo, password) => {
    const { data } = await api.post('/auth/login', { correo, password });
    fijarCsrfToken(data.csrfToken);
    persistirSesion(data.medico);
    // El login no trae los módulos habilitados; se piden aparte para que
    // el menú refleje los permisos reales sin esperar a un refresh.
    await refrescarPerfil();
    return data.medico;
  };

  const actualizarMedico = (medicoParcial) => {
    const actualizado = { ...medico, ...medicoParcial };
    localStorage.setItem('salud_medico', JSON.stringify(actualizado));
    setMedico(actualizado);
    aplicarPaleta(actualizado.color_primario);
    aplicarFavicon(actualizado.foto_logo_url);
    aplicarTitulo(actualizado.empresa);
  };

  const limpiarSesionLocal = () => {
    localStorage.removeItem('salud_medico');
    fijarCsrfToken(null);
    setMedico(null);
    setModulos([]);
    aplicarPaleta(null);
    aplicarFavicon(null);
    aplicarTitulo(null);
  };

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Aunque falle la llamada, se limpia el estado local igual.
    }
    limpiarSesionLocal();
  }, []);

  const refrescarPerfil = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/perfil');
      fijarCsrfToken(data.csrfToken);
      setMedico((prev) => ({ ...prev, ...data.medico }));
      setModulos(data.modulos);
      aplicarPaleta(data.medico.color_primario);
      aplicarFavicon(data.medico.foto_logo_url);
      aplicarTitulo(data.medico.empresa);
      localStorage.setItem('salud_medico', JSON.stringify(data.medico));
    } catch {
      limpiarSesionLocal();
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (medico) {
      aplicarPaleta(medico.color_primario);
      aplicarFavicon(medico.foto_logo_url);
      aplicarTitulo(medico.empresa);
    }
    // La cookie de sesión es httpOnly (invisible para JS), así que la
    // única forma de saber si sigue vigente es preguntarle al backend.
    refrescarPerfil();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tieneModulo = (nombre) => modulos.some((m) => m.nombre === nombre && m.activo);

  return (
    <AuthContext.Provider
      value={{ medico, modulos, cargando, login, logout, refrescarPerfil, tieneModulo, actualizarMedico }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
