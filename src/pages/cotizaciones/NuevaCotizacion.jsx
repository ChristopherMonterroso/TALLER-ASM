import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addCotizacion, getNextNumber } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ClienteVehiculoSelector from '../../components/shared/ClienteVehiculoSelector';
import RepuestosSelector from '../../components/shared/RepuestosSelector';

const NuevaCotizacion = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [clienteVehiculo, setClienteVehiculo] = useState({ clienteId: null, clienteNombre: '', vehiculoId: null, vehiculoData: {} });
  const [repuestos, setRepuestos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [saving, setSaving] = useState(false);

  const addServicio = () => setServicios(s => [...s, { descripcion: '', precio: 0 }]);
  const updateServicio = (idx, field, value) => setServicios(s => s.map((sv, i) => i === idx ? { ...sv, [field]: value } : sv));
  const removeServicio = (idx) => setServicios(s => s.filter((_, i) => i !== idx));

  const totalServicios = servicios.reduce((s, sv) => s + Number(sv.precio || 0), 0);
  const totalRepuestos = repuestos.reduce((s, r) => s + (Number(r.precioVenta) || 0) * (Number(r.cantidad) || 0), 0);
  const total = totalServicios + totalRepuestos;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clienteVehiculo.clienteNombre) { toast.error('Ingresa datos del cliente'); return; }
    setSaving(true);
    try {
      const noCotizacion = await getNextNumber('cotizaciones');
      await addCotizacion({
        ...clienteVehiculo, servicios, repuestos, total,
        noCotizacion, estado: 'pendiente', creadoPor: user?.uid
      });
      toast.success(`Cotización #${String(noCotizacion).padStart(4, '0')} creada`);
      navigate('/cotizaciones');
    } catch { toast.error('Error al crear cotización'); }
    setSaving(false);
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Nueva Cotización</h1><p>Crea una cotización de servicios y repuestos</p></div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h2 className="card-title">Cliente y Vehículo</h2></div>
          <ClienteVehiculoSelector onChange={setClienteVehiculo} />
        </div>

        {/* Servicios */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <h2 className="card-title">Servicios</h2>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addServicio}>+ Agregar Servicio</button>
          </div>
          {servicios.length > 0 ? (
            <>
              {servicios.map((sv, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 36px', gap: 10, marginBottom: 8, alignItems: 'center' }}>
                  <input
                    className="form-input"
                    value={sv.descripcion}
                    onChange={e => updateServicio(idx, 'descripcion', e.target.value)}
                    placeholder="Descripción del servicio"
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Q</span>
                    <input
                      className="form-input"
                      type="number" min="0" step="0.01"
                      value={sv.precio}
                      onChange={e => updateServicio(idx, 'precio', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <button type="button" className="btn btn-danger btn-icon btn-sm" onClick={() => removeServicio(idx)}>✕</button>
                </div>
              ))}
              <div style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-accent)', marginTop: 8 }}>
                Total servicios: Q{totalServicios.toFixed(2)}
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13, fontStyle: 'italic' }}>Sin servicios. Haz clic en "Agregar Servicio".</p>
          )}
        </div>

        {/* Repuestos */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h2 className="card-title">Repuestos</h2></div>
          <RepuestosSelector repuestos={repuestos} onChange={setRepuestos} />
        </div>

        {/* Total */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h2 className="card-title">Total</h2></div>
          <div style={{ maxWidth: 300, marginLeft: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
              <span>Servicios</span><span>Q{totalServicios.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
              <span>Repuestos</span><span>Q{totalRepuestos.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: 20, fontWeight: 800, color: 'var(--color-accent)' }}>
              <span>TOTAL (IVA inc.)</span><span>Q{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/cotizaciones')}>Cancelar</button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>{saving ? 'Guardando...' : 'Crear Cotización'}</button>
        </div>
      </form>
    </div>
  );
};

export default NuevaCotizacion;
