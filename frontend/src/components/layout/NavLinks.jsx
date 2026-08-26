import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NAV_ITEMS } from './navItems';

export default function NavLinks({ onNavigate }) {
  const { tieneModulo, cargando } = useAuth();

  return (
    <nav className="sidebar__nav">
      {NAV_ITEMS.map((item) => {
        const bloqueado = !cargando && item.modulo && !tieneModulo(item.modulo);
        if (bloqueado) {
          return (
            <span key={item.to} className="sidebar__link is-locked" title="Módulo no disponible en tu plan">
              <span className="sidebar__link-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label} 🔒</span>
            </span>
          );
        }
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `sidebar__link ${isActive ? 'is-active' : ''}`}
            onClick={onNavigate}
            title={item.label}
          >
            <span className="sidebar__link-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
