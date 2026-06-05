import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getOrdenById, updateOrden, getClienteById, getConfig } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import generarOrdenPDF from '../../utils/pdf/pdfOrden';

const FUEL_LABELS = { vacio: 'Vacío', cuarto: '1/4', medio: '1/2', tres_cuartos: '3/4', lleno: 'Lleno' };
const STATUS_BADGE = { pendiente: 'badge-warning', en_proceso: 'badge-primary', terminado: 'badge-success' };
const STATUS_LABEL = { pendiente: 'Pendiente', en_proceso: 'En proceso', terminado: 'Terminado' };

const InfoField = ({ label, value }) => (
  <div>
    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
    <div style={{ fontWeight: 500 }}>{value || '—'}</div>
  </div>
);

const OrdenDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orden, setOrden] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const { canWrite } = useAuth();
  const toast = useToast();

  useEffect(() => {
    getOrdenById(id).then(data => { setOrden(data); setLoading(false); });
  }, [id]);

  const handleStatusChange = async (newStatus) => {
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
      const [appearance, company] = await Promise.all([getConfig('appearance'), getConfig('company')]);
      const terminos = appearance?.terminosOrden || null;

      // Datos frescos del cliente
      let ordenConDatosCliente = { ...orden };
      if (orden.clienteId) {
        const clienteFresh = await getClienteById(orden.clienteId);
        if (clienteFresh) {
          ordenConDatosCliente.clienteNit = clienteFresh.nit || '';
          ordenConDatosCliente.clienteDireccion = clienteFresh.direccion || '';
        }
      }

      await generarOrdenPDF(ordenConDatosCliente, company || {}, appearance?.logoUrl, terminos);
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
  const totalMDO = (orden.manoDeObraItems || []).reduce((s, it) => s + Number(it.monto || 0), 0)
    || Number(orden.manoDeObra || 0);
  const anticipo = Number(orden.anticipo || 0);
  const total = Number(orden.total || 0);
  const saldo = total - anticipo;

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
            <select className="form-select" style={{ width: 160 }} value={orden.estado} onChange={e => handleStatusChange(e.target.value)} disabled={saving}>
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

      <div style={{ marginBottom: 16 }}>
        <span className={`badge ${STATUS_BADGE[orden.estado] || 'badge-muted'}`} style={{ fontSize: 13 }}>
          {STATUS_LABEL[orden.estado] || orden.estado}
        </span>
      </div>

      {/* Cliente y vehículo */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><h2 className="card-title">Cliente y Vehículo</h2></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 16 }}>
          <InfoField label="Cliente" value={orden.clienteNombre} />
          <InfoField label="NIT" value={orden.clienteNit} />
          <InfoField label="Marca" value={orden.vehiculoData?.marca} />
          <InfoField label="Línea" value={[orden.vehiculoData?.linea, orden.vehiculoData?.complemento].filter(Boolean).join(' ')} />
          <InfoField label="Modelo" value={orden.vehiculoData?.modelo} />
          <InfoField label="Placa" value={orden.vehiculoData?.placa} />
          <InfoField label="Color" value={orden.vehiculoData?.color} />
          <InfoField label="Chasis" value={orden.vehiculoData?.chasis} />
          <InfoField label="Kilometraje" value={orden.kilometraje ? `${orden.kilometraje} km` : null} />
          <InfoField label="Combustible" value={FUEL_LABELS[orden.nivelCombustible] || orden.nivelCombustible} />
        </div>
      </div>

      {/* Falla reportada */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><h2 className="card-title">Falla Reportada</h2></div>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {orden.fallaReportada || '—'}
        </p>
      </div>

      {/* Mano de obra detallada */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><h2 className="card-title">Mano de Obra</h2></div>
        {orden.manoDeObraItems && orden.manoDeObraItems.length > 0 ? (
          <div className="table-wrapper">
            <table className="table responsive-table">
              <thead><tr><th>#</th><th>Descripción del Trabajo</th><th style={{ textAlign: 'right' }}>Monto</th></tr></thead>
              <tbody>
                {orden.manoDeObraItems.map((it, i) => (
                  <tr key={i}>
                    <td data-label="#" style={{ width: 36 }}>{i + 1}</td>
                    <td data-label="Descripción">{it.descripcion}</td>
                    <td data-label="Monto" style={{ textAlign: 'right', fontWeight: 600 }}>Q{Number(it.monto || 0).toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="table-total-row" style={{ borderTop: '2px solid var(--color-border)' }}>
                  <td colSpan={2} style={{ fontWeight: 700, color: 'var(--color-text-muted)', fontSize: 13 }}>Total mano de obra:</td>
                  <td style={{ fontWeight: 800, color: 'var(--color-accent)', textAlign: 'right' }}>Q{totalMDO.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : orden.manoDeObra ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Q{Number(orden.manoDeObra).toFixed(2)}</p>
        ) : (
          <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: 13 }}>Sin mano de obra registrada.</p>
        )}
      </div>

      {/* Repuestos */}
      {orden.repuestos && orden.repuestos.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h2 className="card-title">Repuestos</h2></div>
          <div className="table-wrapper">
            <table className="table responsive-table">
              <thead><tr><th>#</th><th>Nombre</th><th>Marca</th><th>Cant.</th><th>P. Unitario</th><th>P. Venta</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
              <tbody>
                {orden.repuestos.map((r, i) => (
                  <tr key={i}>
                    <td data-label="#">{i + 1}</td>
                    <td data-label="Nombre">{r.nombre}</td>
                    <td data-label="Marca">{r.marca || '—'}</td>
                    <td data-label="Cant.">{r.cantidad}</td>
                    <td data-label="P. Unitario">Q{Number(r.precioUnitario || 0).toFixed(2)}</td>
                    <td data-label="P. Venta" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Q{Number(r.precioVenta || 0).toFixed(2)}</td>
                    <td data-label="Total" style={{ textAlign: 'right', fontWeight: 700 }}>Q{((r.precioVenta || r.precioUnitario || 0) * r.cantidad).toFixed(2)}</td>
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
        <div className="detalle-totales" style={{ maxWidth: 340, marginLeft: 'auto' }}>
          {[
            { label: 'Subtotal repuestos', value: totalRepuestos },
            { label: 'Mano de obra', value: totalMDO },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: 14 }}>
              <span>{label}</span><span>Q{value.toFixed(2)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 17, fontWeight: 700, color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)' }}>
            <span>Total</span><span>Q{total.toFixed(2)}</span>
          </div>
          {anticipo > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 14, color: 'var(--color-success)', borderBottom: '1px solid var(--color-border)' }}>
              <span>Anticipo recibido</span><span>- Q{anticipo.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: 22, fontWeight: 800, color: 'var(--color-accent)' }}>
            <span>SALDO</span><span>Q{(anticipo > 0 ? saldo : total).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdenDetalle;
