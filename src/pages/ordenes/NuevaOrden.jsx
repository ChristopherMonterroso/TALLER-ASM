import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addOrden, getNextNumber, getConfig } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ClienteVehiculoSelector from '../../components/shared/ClienteVehiculoSelector';
import RepuestosSelector from '../../components/shared/RepuestosSelector';

const FUEL_OPTIONS = [
  { value: 'vacio', label: 'Vacío' },
  { value: 'cuarto', label: '1/4' },
  { value: 'medio', label: '1/2' },
  { value: 'tres_cuartos', label: '3/4' },
  { value: 'lleno', label: 'Lleno' },
];

// ─── Mano de Obra con detalle de ítems ───────────────────────────────────────
const ManoDeObraDetalle = ({ items, onChange }) => {
  const addItem = () => onChange([...items, { descripcion: '', monto: '' }]);
  const update = (idx, field, val) =>
    onChange(items.map((it, i) => (i === idx ? { ...it, [field]: val } : it)));
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));

  const total = items.reduce((s, it) => s + Number(it.monto || 0), 0);

  return (
    <div>
      {items.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {items.map((it, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 34px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <input
                className="form-input"
                value={it.descripcion}
                onChange={e => update(idx, 'descripcion', e.target.value)}
                placeholder="Descripción del trabajo (ej: Cambio de aceite, Ajuste de frenos…)"
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Q</span>
                <input
                  className="form-input"
                  type="number" min="0" step="0.01"
                  value={it.monto}
                  onChange={e => update(idx, 'monto', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => remove(idx)}
                style={{ width: 34, height: 34, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ✕
              </button>
            </div>
          ))}
          <div style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-accent)', fontSize: 14, marginTop: 4 }}>
            Total mano de obra: Q{total.toFixed(2)}
          </div>
        </div>
      )}
      <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>
        + Agregar ítem de trabajo
      </button>
      {items.length === 0 && (
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8, fontStyle: 'italic' }}>
          Agrega los trabajos realizados con su costo individual.
        </p>
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const NuevaOrden = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [clienteVehiculo, setClienteVehiculo] = useState({
    clienteId: null, clienteNombre: '', vehiculoId: null, vehiculoData: {}
  });
  const [repuestos, setRepuestos] = useState([]);
  const [manoDeObraItems, setManoDeObraItems] = useState([]);
  const [form, setForm] = useState({
    kilometraje: '', nivelCombustible: 'medio', fallaReportada: '',
    anticipo: '', estado: 'pendiente'
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const totalRepuestos = repuestos.reduce((s, r) => s + (Number(r.precioVenta) || 0) * (Number(r.cantidad) || 0), 0);
  const totalManoDeObra = manoDeObraItems.reduce((s, it) => s + Number(it.monto || 0), 0);
  const anticipo = Number(form.anticipo || 0);
  const subtotal = totalRepuestos + totalManoDeObra;
  const saldo = subtotal - anticipo;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clienteVehiculo.clienteNombre) { toast.error('Ingresa datos del cliente o vehículo'); return; }
    setSaving(true);
    try {
      const [noOrden, appearance, company] = await Promise.all([
        getNextNumber('ordenes'), getConfig('appearance'), getConfig('company')
      ]);
      const repuestosInventario = repuestos.filter(r => r.inventarioId)
        .map(r => ({ id: r.inventarioId, cantidad: r.cantidad }));
      await addOrden({
        ...form,
        ...clienteVehiculo,
        repuestos,
        manoDeObraItems,
        manoDeObra: totalManoDeObra,
        total: subtotal,
        anticipo,
        saldo,
        noOrden,
        creadoPor: user?.uid,
        companyName: company?.name || 'Auto Servicios Monterroso',
      }, repuestosInventario);
      toast.success(`Orden #${String(noOrden).padStart(4, '0')} creada`);
      navigate('/ordenes');
    } catch (err) { toast.error('Error al crear orden'); console.error(err); }
    setSaving(false);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Nueva Orden de Trabajo</h1>
          <p>Completa los datos del vehículo y trabajo a realizar</p>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        {/* Cliente y vehículo */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h2 className="card-title">Cliente y Vehículo</h2></div>
          <ClienteVehiculoSelector onChange={setClienteVehiculo} />
        </div>

        {/* Datos de ingreso */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h2 className="card-title">Datos de Ingreso</h2></div>
          <div className="form-row form-row-3">
            <div className="form-group">
              <label className="form-label">Kilometraje</label>
              <input name="kilometraje" value={form.kilometraje} onChange={handleChange} className="form-input" placeholder="Ej: 45000" type="number" min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select name="estado" value={form.estado} onChange={handleChange} className="form-select">
                <option value="pendiente">Pendiente</option>
                <option value="en_proceso">En proceso</option>
                <option value="terminado">Terminado</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Nivel de Combustible</label>
              <div className="fuel-selector">
                {FUEL_OPTIONS.map(opt => (
                  <button key={opt.value} type="button"
                    className={`fuel-btn ${form.nivelCombustible === opt.value ? 'active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, nivelCombustible: opt.value }))}
                  >{opt.label}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Falla Reportada por el Cliente</label>
            <textarea name="fallaReportada" value={form.fallaReportada} onChange={handleChange}
              className="form-textarea" placeholder="Describe la falla o síntoma reportado por el cliente..." rows={3} />
          </div>
        </div>

        {/* Mano de obra */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h2 className="card-title">Mano de Obra</h2></div>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12 }}>
            Detalla cada trabajo o servicio realizado con su costo individual.
          </p>
          <ManoDeObraDetalle items={manoDeObraItems} onChange={setManoDeObraItems} />
        </div>

        {/* Repuestos */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h2 className="card-title">Repuestos</h2></div>
          <RepuestosSelector repuestos={repuestos} onChange={setRepuestos} />
        </div>

        {/* Totales */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h2 className="card-title">Resumen de Cobro</h2></div>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">Anticipo recibido (Q)</label>
              <input name="anticipo" type="number" min="0" step="0.01" value={form.anticipo}
                onChange={handleChange} className="form-input" placeholder="0.00" />
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
                Monto que el cliente dejó como adelanto.
              </p>
            </div>
            <div style={{
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              padding: '14px 18px', background: 'var(--color-surface-2)',
              borderRadius: 'var(--radius)', border: '1px solid var(--color-border)'
            }}>
              {[
                { label: 'Repuestos:', value: totalRepuestos },
                { label: 'Mano de obra:', value: totalManoDeObra },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                  <span>{label}</span><span>Q{value.toFixed(2)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: 'var(--color-text)', borderTop: '1px solid var(--color-border)', paddingTop: 8, marginBottom: 4 }}>
                <span>Subtotal:</span><span>Q{subtotal.toFixed(2)}</span>
              </div>
              {anticipo > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-success)', marginBottom: 4 }}>
                  <span>Anticipo:</span><span>- Q{anticipo.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 800, color: 'var(--color-accent)', borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
                <span>SALDO:</span><span>Q{saldo.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/ordenes')}>Cancelar</button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? 'Guardando...' : 'Crear Orden'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NuevaOrden;
