import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import './styles/global.css';

// Sin VITE_SENTRY_DSN definida, el SDK no envía nada — seguro en desarrollo local.
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
});

function PantallaError() {
  return (
    <div className="auth-page">
      <div className="card auth-card" style={{ textAlign: 'center' }}>
        <h1>Ocurrió un error inesperado</h1>
        <p>El equipo ya fue notificado. Intenta recargar la página.</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Recargar
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<PantallaError />}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
