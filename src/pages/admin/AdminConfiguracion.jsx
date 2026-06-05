import { useEffect, useState } from 'react';
import { getConfig, setConfig } from '../../firebase/firestore';
import { uploadLogo } from '../../firebase/storage';
import { useTheme, THEMES } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import logoDefault from '../../assets/logo-default.png';
import { DEFAULT_TERMINOS } from '../../data/terminosOrden';

const THEME_INFO = {
  'steel-dark': { name: 'Steel Dark', colors: ['#0F172A', '#1E293B', '#3B82F6', '#F59E0B'] },
  'carbon-fire': { name: 'Carbon & Fire', colors: ['#111111', '#1C1C1C', '#EF4444', '#F97316'] },
  'midnight-garage': { name: 'Midnight Garage', colors: ['#0D1117', '#161B22', '#10B981', '#F0B429'] },
  'classic-light': { name: 'Classic Light', colors: ['#F8FAFC', '#FFFFFF', '#2563EB', '#D97706'] },
};

const AdminConfiguracion = () => {
  const { theme, changeTheme } = useTheme();
  const toast = useToast();

  const [company, setCompany] = useState({
    name: 'Auto Servicios Monterroso',
    occupation: 'Taller de mecánica general, enderezado y pintura',
    address: '10 avenida 7-65, Nueva Montserrat, Zona 3 de Mixco',
    phone: '(502) 5648-6979',
    socialReason: 'Razón social: Mayra Alegría',
  });
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [terminos, setTerminos] = useState(DEFAULT_TERMINOS);
  const [savingTerminos, setSavingTerminos] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getConfig('company'), getConfig('appearance')]).then(([comp, app]) => {
      if (comp) setCompany(comp);
      if (app?.logoUrl) setLogoUrl(app.logoUrl);
      if (app?.terminosOrden) setTerminos(app.terminosOrden);
      setLoading(false);
    });
  }, []);

  const handleCompanyChange = (e) => {
    setCompany(c => ({ ...c, [e.target.name]: e.target.value }));
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setSavingCompany(true);
    try {
      await setConfig('company', company);
      // Merge — don't overwrite logoUrl or theme
      const currentApp = await getConfig('appearance');
      await setConfig('appearance', { ...currentApp, companyName: company.name });
      toast.success('Datos de empresa guardados');
    } catch { toast.error('Error al guardar'); }
    setSavingCompany(false);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 512 * 1024) {
      toast.error('El logo debe ser menor a 500 KB');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    setSavingLogo(true);
    try {
      // Convert to base64 — stored in Firestore, no CORS needed
      const base64 = await uploadLogo(logoFile);
      const currentApp = await getConfig('appearance');
      await setConfig('appearance', { ...currentApp, logoUrl: base64 });
      setLogoUrl(base64);
      setLogoPreview(null);
      setLogoFile(null);
      toast.success('Logo actualizado correctamente');
    } catch (err) {
      toast.error(err.message || 'Error al guardar logo');
    }
    setSavingLogo(false);
  };

  const handleRemoveLogo = async () => {
    setSavingLogo(true);
    try {
      const currentApp = await getConfig('appearance');
      await setConfig('appearance', { ...currentApp, logoUrl: null });
      setLogoUrl(null);
      toast.success('Logo restablecido al valor por defecto');
    } catch {
      toast.error('Error al restablecer logo');
    }
    setSavingLogo(false);
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <div><h1>Configuración</h1><p>Personaliza la apariencia y datos del taller</p></div>
      </div>

      {/* Theme picker */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><h2 className="card-title">Paleta de Colores</h2></div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 20 }}>
          El tema se aplica en tiempo real para todos los usuarios de la app.
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {Object.entries(THEME_INFO).map(([key, info]) => (
            <button
              key={key}
              type="button"
              onClick={() => changeTheme(key)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                outline: 'none', borderRadius: 12,
              }}
            >
              <div
                style={{
                  width: 140,
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: `2px solid ${theme === key ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  transition: 'all 0.2s',
                  boxShadow: theme === key ? '0 0 0 3px var(--color-primary-light)' : 'none',
                }}
              >
                {/* Color preview */}
                <div style={{ height: 70, background: info.colors[0], display: 'flex', padding: 8, gap: 4, alignItems: 'flex-end' }}>
                  {info.colors.map((c, i) => (
                    <div key={i} style={{ flex: 1, height: i === 0 ? 20 : i === 1 ? 30 : 40, background: c, borderRadius: 4, opacity: i === 0 ? 0 : 1 }} />
                  ))}
                </div>
                <div style={{
                  padding: '8px 10px',
                  background: info.colors[1],
                  fontSize: 11,
                  fontWeight: 600,
                  textAlign: 'center',
                  color: '#ccc',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {info.name}
                  {theme === key && <span style={{ marginLeft: 6, color: 'var(--color-primary)' }}>✓</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Logo */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><h2 className="card-title">Logo del Taller</h2></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <img
            src={logoPreview || logoUrl || logoDefault}
            alt="Logo actual"
            style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', border: '2px solid var(--color-border)', background: 'white' }}
          />
          <div style={{ flex: 1 }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 4 }}>
              PNG o JPG cuadrado recomendado (ej: 200×200 px).
            </p>
            <p style={{ color: 'var(--color-warning)', fontSize: 12, marginBottom: 12 }}>
              Tamaño máximo: <strong>500 KB</strong>
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                Seleccionar archivo
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoChange} style={{ display: 'none' }} />
              </label>
              {logoFile && (
                <button className="btn btn-primary" onClick={handleUploadLogo} disabled={savingLogo}>
                  {savingLogo ? 'Guardando...' : 'Guardar Logo'}
                </button>
              )}
              {logoUrl && !logoFile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-success)' }}>Logo configurado</span>
                  <button type="button" className="btn btn-danger btn-sm" onClick={handleRemoveLogo} disabled={savingLogo}>
                    Restaurar por defecto
                  </button>
                </div>
              )}
            </div>
            {logoFile && (
              <p style={{ fontSize: 12, color: 'var(--color-success)', marginTop: 8 }}>
                {logoFile.name} · {(logoFile.size / 1024).toFixed(0)} KB — listo para guardar
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Company data */}
      <div className="card">
        <div className="card-header"><h2 className="card-title">Datos del Taller</h2></div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 20 }}>
          Estos datos aparecen en el encabezado de todos los PDFs generados.
        </p>
        <form onSubmit={handleSaveCompany}>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">Nombre del Taller</label>
              <input name="name" value={company.name} onChange={handleCompanyChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Especialidad / Ocupación</label>
              <input name="occupation" value={company.occupation} onChange={handleCompanyChange} className="form-input" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Dirección</label>
            <input name="address" value={company.address} onChange={handleCompanyChange} className="form-input" />
          </div>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input name="phone" value={company.phone} onChange={handleCompanyChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Razón Social</label>
              <input name="socialReason" value={company.socialReason} onChange={handleCompanyChange} className="form-input" />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={savingCompany}>
              {savingCompany ? 'Guardando...' : 'Guardar Datos'}
            </button>
          </div>
        </form>
      </div>
      {/* Términos de la orden */}
      <div className="card">
        <div className="card-header"><h2 className="card-title">Términos de la Orden de Trabajo</h2></div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 16 }}>
          Estos términos aparecen al pie de la firma del cliente en cada PDF de orden de trabajo.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {terminos.map((t, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 36px', gap: 8, alignItems: 'flex-start' }}>
              <textarea
                className="form-textarea"
                rows={2}
                value={t}
                onChange={e => {
                  const next = [...terminos];
                  next[i] = e.target.value;
                  setTerminos(next);
                }}
                style={{ fontSize: 13 }}
              />
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => setTerminos(terminos.filter((_, j) => j !== i))}
                style={{ width: 36, height: 36, padding: 0 }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setTerminos([...terminos, ''])}
          >
            + Agregar Término
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setTerminos([...DEFAULT_TERMINOS])}
          >
            Restaurar por defecto
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={savingTerminos}
            onClick={async () => {
              setSavingTerminos(true);
              try {
                const currentApp = await getConfig('appearance');
                await setConfig('appearance', { ...currentApp, terminosOrden: terminos });
                toast.success('Términos guardados');
              } catch { toast.error('Error al guardar'); }
              setSavingTerminos(false);
            }}
          >
            {savingTerminos ? 'Guardando...' : 'Guardar Términos'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminConfiguracion;
