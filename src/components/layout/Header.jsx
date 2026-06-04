import { useAuth } from '../../context/AuthContext';

const Header = ({ collapsed, pageTitle, onMobileMenuToggle }) => {
  const { userData } = useAuth();

  const initials = userData?.displayName
    ? userData.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const roleLabel = userData?.role === 'admin' ? 'Administrador'
    : userData?.permissions?.write ? 'Empleado' : 'Solo Lectura';

  return (
    <header className={`header ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          className="btn btn-ghost btn-icon"
          onClick={onMobileMenuToggle}
          style={{ display: 'none' }}
          id="mobile-menu-btn"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <span className="header-title">{pageTitle}</span>
      </div>
      <div className="header-right">
        <div className="header-user">
          <div className="header-avatar">{initials}</div>
          <div className="header-user-info">
            <div className="header-user-name">{userData?.displayName || 'Usuario'}</div>
            <div className="header-user-role">{roleLabel}</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
