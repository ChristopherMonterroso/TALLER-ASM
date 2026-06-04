import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getOrdenById, updateOrden, getConfig } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import generarOrdenPDF from '../../utils/pdf/pdfOrden';

const FUEL_LABELS = { vacio: 'Vacío', cuarto: '1/4', medio: '1/2', tres_cuartos: '3/4', lleno: 'Lleno' };
const STATUS_BADGE = { pendiente: 'badge-warning', en_proceso: 'badge-primary', terminado: 'badge-success' };
const STATUS_LABEL = { pendiente: 'Pendiente', en_proceso: 'En proceso', terminado: 'Terminado' };

const OrdenDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orden, setOrden] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const { canWrite } = useAuth();
  const toast = useToast();

  useEffect(() => {
    getOrdenById(id).then(data => {
      setOrden(data);
      setStatus(data?.estado || 'pendiente');
      setLoading(false);
    });
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    setSaving(true);
    try {
      await updateOrden(id, { estado: newStatus });
      setOrden(prev => ({ ...prev, estado: newStatus }));
      toast.success('Estado actualizado');
    } catch { toast.error('Error al actualizar'); }
    setSaving(false);
  };

  const handlePDF = async () => {
    setGeneratingPDF(true);
    try {
      const config = await getConfig('appearance');
      const company = await getConfig('company');
      await generarOrdenPDF(orden, company || {}, config?.logoUrl);
    } catch (err) { toast.error('Error al generar PDF'); console.error(err); }
    setGeneratingPDF(false);
  };

  if (loading) return <div className="spinner" />;
  if (!orden) return (
    <div className="empty-state">
      <h3>Orden no encontrada</h3>
      <Link to="/ordenes" className="btn btn-primary" style={{ marginTop: 12 }}>Volver</Link>
    </div>
  );

  const totalRepuestos = (orden.repuestos || []).reduce((s, r) => s + (r.precioVenta || r.precioUnitario || 0) * r.cantidad, 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ marginBottom: 4 }}><Link to="/ordenes" className="btn btn-ghost btn-sm">← Órdenes</Link></div>
          <h1>Orden #{String(orden.noOrden || '').padStart(4, '0')}</h1>
          <p>{orden.clienteNombre}</p>
        </div>
        <div className="page-header-actions">
          {canWrite() && (
            <select className="form-select" style={{ width: 160 }} value={status} onChange={e => handleStatusChange(e.target.value)} disabled={saving}>
              <option value="pendiente">Pendiente</option>
              <option value="en_proceso">En proceso</option>
              <option value="terminado">Terminado</option>
            </select>
          )}
          <button className="btn btn-accent" onClick={handlePDF} disabled={generatingPDF}>
            {generatingPDF ? 'Generando...' : 'Generar PDF'}
          </button>
        </div>
      </div>

      {/* Status badge */}
      <div style={{ marginBottom: 16 }}>
        <span className={`badge ${STATUS_BADGE[orden.estado]}`} style={{ fontSize: 13 }}>
          {STATUS_LABEL[orden.estado]}
        </span>
      </div>

      {/* Cliente y vehículo */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><h2 className="card-title">Cliente y Vehículo</h2></div>
        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          {[
            { label: 'Cliente', value: orden.clienteNombre || '—' },
            { label: 'Marca', value: orden.vehiculoData?.marca || '—' },
            { label: 'Línea', value: [orden.vehiculoData?.linea, orden.vehiculoData?.complemento].filter(Boolean).join(' ') || '—' },
            { label: 'Modelo', value: orden.vehiculoData?.modelo || '—' },
            { label: 'Placa', value: orden.vehiculoData?.placa || '—' },
            { label: 'Color', value: orden.vehiculoData?.color || '—' },
            { label: 'Chasis', value: orden.vehiculoData?.chasis || '—' },
            { label: 'Kilometraje', value: orden.kilometraje ? `${orden.kilometraje} km` : '—' },
            { label: 'Combustible', value: FUEL_LABELS[orden.nivelCombustible] || orden.nivelCombustible || '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
              <div style={{ fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Falla y trabajo */}
      <div className="form-row form-row-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-header"><h2 className="card-title">Falla Reportada</h2></div>
          <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{orden.fallaReportada || '—'}</p>
        </div>
        <div className="card">
          <div className="card-header"><h2 className="card-title">Trabajo Realizado</h2></div>
          <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{orden.trabajoRealizado || '—'}</p>
        </div>
      </div>

      {/* Repuestos */}
      {orden.repuestos && orden.repuestos.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h2 className="card-title">Repuestos</h2></div>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Nombre</th><th>Marca</th><th>Cant.</th><th>P. Unitario</th><th>P. Venta</th><th>Total</th></tr></thead>
              <tbody>
                {orden.repuestos.map((r, i) => (
                  <tr key={i}>
                    <td>{r.nombre}</td>
                    <td>{r.marca || '—'}</td>
                    <td>{r.cantidad}</td>
                    <td>Q{Number(r.precioUnitario || 0).toFixed(2)}</td>
                    <td style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Q{Number(r.precioVenta || 0).toFixed(2)}</td>
                    <td style={{ fontWeight: 700 }}>Q{((r.precioVenta || r.precioUnitario || 0) * r.cantidad).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Totales */}
      <div className="card">
        <div className="card-header"><h2 className="card-title">Resumen de Cobro</h2></div>
        <div style={{ maxWidth: 320, marginLeft: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
            <span>Subtotal repuestos</span><span>Q{totalRepuestos.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
            <span>Mano de obra</span><span>Q{Number(orden.manoDeObra || 0).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: 20, fontWeight: 800, color: 'var(--color-accent)' }}>
            <span>TOTAL</span><span>Q{Number(orden.total || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdenDetalle;
