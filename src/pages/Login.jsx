import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithEmail } from '../firebase/auth';
import { useToast } from '../context/ToastContext';
import logoDefault from '../assets/logo-default.png';

const DOMAIN = '@asm.com';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) { toast.error('Ingresa usuario y contraseña'); return; }
    setLoading(true);
    try {
      const email = username.includes('@') ? username : `${username}${DOMAIN}`;
      await loginWithEmail(email, password);
      navigate('/');
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential' ? 'Usuario o contraseña incorrectos'
        : err.code === 'auth/user-disabled' ? 'Usuario desactivado'
        : 'Error al iniciar sesión';
      toast.error(msg);
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img src={logoDefault} alt="ASM Logo" style={{ width: 72, height: 72, borderRadius: 14, objectFit: 'cover' }} />
        </div>
        <div className="login-title">
          <h1>Auto Servicios Monterroso</h1>
          <p>Ingresa tus credenciales para continuar</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-username"
                type="text"
                className="form-input"
                placeholder="tu.nombre"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                style={{ paddingRight: username && !username.includes('@') ? '110px' : '14px' }}
              />
              {username && !username.includes('@') && (
                <span style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)', fontSize: 14, pointerEvents: 'none', whiteSpace: 'nowrap',
                  fontStyle: 'italic',
                }}>
                  {DOMAIN}
                </span>
              )}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button id="login-btn" type="submit" className="btn btn-primary w-full" style={{ marginTop: 8, padding: '12px' }} disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--color-text-muted)' }}>
          Sistema de gestión v1.0 · Auto Servicios Monterroso
        </p>
      </div>
    </div>
  );
};

export default Login;
