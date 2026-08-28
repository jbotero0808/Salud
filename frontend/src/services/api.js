import axios from 'axios';

const METODOS_MUTANTES = new Set(['post', 'put', 'patch', 'delete']);

function leerCookie(nombre) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${nombre}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// En local, Vite hace proxy de /api hacia el backend (ver vite.config.js).
// En producción, el frontend y el backend son proyectos de Vercel
// distintos, así que VITE_API_URL debe apuntar a la URL pública del
// backend (ej. https://salud-backend.vercel.app/api).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  // La sesión viaja en una cookie httpOnly, no en un header manual —
  // sin esto el navegador no la envía en peticiones cross-origin.
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const metodo = (config.method || 'get').toLowerCase();
  if (METODOS_MUTANTES.has(metodo)) {
    const csrf = leerCookie('salud_csrf');
    if (csrf) {
      config.headers['X-CSRF-Token'] = csrf;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('salud_medico');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
