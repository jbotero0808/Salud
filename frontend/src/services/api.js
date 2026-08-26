import axios from 'axios';

// En local, Vite hace proxy de /api hacia el backend (ver vite.config.js).
// En producción, el frontend y el backend son proyectos de Vercel
// distintos, así que VITE_API_URL debe apuntar a la URL pública del
// backend (ej. https://salud-backend.vercel.app/api).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('salud_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('salud_token');
      localStorage.removeItem('salud_medico');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
