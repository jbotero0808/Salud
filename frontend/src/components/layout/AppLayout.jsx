import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NavLinks from './NavLinks';
import MedicoBrand from './MedicoBrand';

export default function AppLayout() {
  const { medico, logout } = useAuth();
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [sidebarColapsado, setSidebarColapsado] = useState(
    () => localStorage.getItem('salud_sidebar_colapsado') === 'true'
  );

  useEffect(() => {
    localStorage.setItem('salud_sidebar_colapsado', String(sidebarColapsado));
  }, [sidebarColapsado]);

  return (
    <div className="app-layout">
      <aside className={`sidebar ${sidebarColapsado ? 'is-collapsed' : ''}`}>
        <MedicoBrand />
        <NavLinks />

        <div style={{ marginTop: 'auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            className="sidebar__collapse-toggle"
            onClick={() => setSidebarColapsado((v) => !v)}
            title={sidebarColapsado ? 'Expandir menú' : 'Colapsar menú'}
          >
            <span className="sidebar-label">{sidebarColapsado ? 'Expandir' : 'Colapsar'}</span>
            <span>{sidebarColapsado ? '»' : '«'}</span>
          </button>
          <button className="btn btn-secondary btn-block" onClick={logout} title="Cerrar sesión">
            <span className="sidebar-label">Cerrar sesión</span>
            <span className="sidebar__collapsed-icon">⎋</span>
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header className="topbar">
          <button className="topbar__menu-btn" onClick={() => setDrawerAbierto(true)} aria-label="Abrir menú">
            ☰
          </button>
          <span className="topbar__brand">
            {medico?.foto_logo_url && (
              <img src={medico.foto_logo_url} alt={medico.nombre} className="topbar__logo" />
            )}
            {medico?.nombre}
          </span>
          <span />
        </header>

        {drawerAbierto && (
          <>
            <div className="drawer-overlay" onClick={() => setDrawerAbierto(false)} />
            <div className="drawer">
              <MedicoBrand />
              <NavLinks onNavigate={() => setDrawerAbierto(false)} />
              <div style={{ marginTop: 'auto', padding: '0 20px' }}>
                <button className="btn btn-secondary btn-block" onClick={logout}>Cerrar sesión</button>
              </div>
            </div>
          </>
        )}

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
