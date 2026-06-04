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

const NuevaOrden = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [clienteVehiculo, setClienteVehiculo] = useState({ clienteId: null, clienteNombre: '', vehiculoId: null, vehiculoData: {} });
  const [repuestos, setRepuestos] = useState([]);
  const [form, setForm] = useState({
    kilometraje: '', nivelCombustible: 'medio', fallaReportada: '', trabajoRealizado: '',
    manoDeObra: '', estado: 'pendiente'
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const totalRepuestos = repuestos.reduce((s, r) => s + (Number(r.precioVenta) || 0) * (Number(r.cantidad) || 0), 0);
  const total = totalRepuestos + Number(form.manoDeObra || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clienteVehiculo.clienteNombre) { toast.error('Ingresa datos del cliente o vehículo'); return; }
    setSaving(true);
    try {
      const [noOrden, company] = await Promise.all([getNextNumber('ordenes'), getConfig('appearance')]);
      const repuestosInventario = repuestos.filter(r => r.inventarioId).map(r => ({ id: r.inventarioId, cantidad: r.cantidad }));
      await addOrden({
        ...form,
        ...clienteVehiculo,
        repuestos,
        total,
        noOrden,
        creadoPor: user?.uid,
        companyName: company?.companyName || 'Auto Servicios Monterroso',
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
              <label className="form-label">Estado de la orden</label>
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
                  <button
                    key={opt.value}
                    type="button"
                    className={`fuel-btn ${form.nivelCombustible === opt.value ? 'active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, nivelCombustible: opt.value }))}
                  >{opt.label}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Falla Reportada</label>
            <textarea name="fallaReportada" value={form.fallaReportada} onChange={handleChange} className="form-textarea" placeholder="Describe la falla o síntoma reportado por el cliente..." rows={3} />
          </div>
          <div className="form-group">
            <label className="form-label">Trabajo Realizado</label>
            <textarea name="trabajoRealizado" value={form.trabajoRealizado} onChange={handleChange} className="form-textarea" placeholder="Describe el trabajo realizado en el vehículo..." rows={3} />
          </div>
        </div>

        {/* Repuestos */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h2 className="card-title">Repuestos</h2></div>
          <RepuestosSelector repuestos={repuestos} onChange={setRepuestos} />
        </div>

        {/* Totales */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h2 className="card-title">Totales</h2></div>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">Mano de Obra (Q)</label>
              <input name="manoDeObra" type="number" min="0" step="0.01" value={form.manoDeObra} onChange={handleChange} className="form-input" placeholder="0.00" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '12px 16px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                <span>Repuestos:</span><span>Q{totalRepuestos.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                <span>Mano de obra:</span><span>Q{Number(form.manoDeObra || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color: 'var(--color-accent)', borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
                <span>TOTAL:</span><span>Q{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/ordenes')}>Cancelar</button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>{saving ? 'Guardando...' : 'Crear Orden'}</button>
        </div>
      </form>
    </div>
  );
};

export default NuevaOrden;
