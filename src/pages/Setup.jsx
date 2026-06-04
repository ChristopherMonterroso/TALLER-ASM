import { useState } from 'react';
import { createAuthUser } from '../firebase/auth';
import { setDocument, setConfig } from '../firebase/firestore';
import { useNavigate } from 'react-router-dom';

// This page only works if no admin exists yet
// Visit /setup to run initial configuration
const Setup = () => {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const runSetup = async () => {
    setStatus('running');
    setError('');
    try {
      // Create admin user
      const cred = await createAuthUser('admin@asm.com', 'Admin1234!');
      const uid = cred.user.uid;

      // Create user doc
      await setDocument('users', uid, {
        displayName: 'Administrador',
        email: 'admin@asm.com',
        role: 'admin',
        permissions: { read: true, write: true },
        active: true,
      });

      // Initial config
      await setConfig('appearance', {
        theme: 'steel-dark',
        logoUrl: null,
        companyName: 'Auto Servicios Monterroso',
      });

      await setConfig('company', {
        name: 'Auto Servicios Monterroso',
        occupation: 'Taller de mecánica general, enderezado y pintura',
        address: '10 avenida 7-65, Nueva Montserrat, Zona 3 de Mixco',
        phone: '(502) 5648-6979',
        socialReason: 'Razón social: Mayra Alegría',
      });

      await setConfig('contadores', { ordenes: 0, cotizaciones: 0, revisiones: 0 });

      setStatus('done');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Error en la configuración');
      setStatus('error');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>Configuración</div>
          <h1 style={{ fontSize: 20, fontWeight: 800 }}>Configuración Inicial</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 8, fontSize: 14 }}>
            Crea el usuario administrador inicial del sistema.
          </p>
        </div>

        {status === 'idle' && (
          <>
            <div style={{ background: 'var(--color-surface-2)', padding: 16, borderRadius: 'var(--radius)', marginBottom: 24, fontSize: 14 }}>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>Se creará el siguiente usuario:</p>
              <p><strong>admin@asm.com</strong></p>
              <p><strong>Admin1234!</strong></p>
              <p style={{ color: 'var(--color-warning)', marginTop: 8, fontSize: 12 }}>Cambia la contraseña después de iniciar sesión.</p>
            </div>
            <button className="btn btn-primary w-full" style={{ padding: 12 }} onClick={runSetup}>
              Inicializar Sistema
            </button>
          </>
        )}

        {status === 'running' && (
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" />
            <p style={{ color: 'var(--color-text-muted)', marginTop: 16 }}>Configurando...</p>
          </div>
        )}

        {status === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>Completado</div>
            <h2 style={{ marginBottom: 8 }}>¡Sistema configurado!</h2>
            <p style={{ color: 'var(--color-text-muted)' }}>Redirigiendo al login...</p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--color-danger)', padding: 16, borderRadius: 'var(--radius)', marginBottom: 16 }}>
              <p style={{ color: 'var(--color-danger)', fontSize: 14 }}>{error}</p>
              {error.includes('email-already-in-use') && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: 12, marginTop: 8 }}>El usuario ya existe. Ve directamente al <a href="/login" style={{ color: 'var(--color-primary)' }}>login</a>.</p>
              )}
            </div>
            <button className="btn btn-secondary w-full" onClick={() => navigate('/login')}>Ir al Login</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Setup;
