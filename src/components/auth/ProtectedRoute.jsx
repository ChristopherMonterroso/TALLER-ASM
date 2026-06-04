import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ children, requireAdmin = false, requireWrite = false }) => {
  const { user, userData, loading } = useAuth();

  if (loading || (user && !userData)) return <div className="loading-screen"><div className="spinner" /><p style={{ color: 'var(--color-text-muted)' }}>Cargando...</p></div>;

  if (!user) return <Navigate to="/login" replace />;

  if (!userData?.active) return (
    <div className="loading-screen">
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>Acceso Denegado</div>
        <h2 style={{ marginBottom: 8 }}>Cuenta desactivada</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>Contacta al administrador del sistema.</p>
      </div>
    </div>
  );

  if (requireAdmin && userData?.role !== 'admin') return <Navigate to="/" replace />;

  return children;
};

export const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (user) return <Navigate to="/" replace />;
  return children;
};
