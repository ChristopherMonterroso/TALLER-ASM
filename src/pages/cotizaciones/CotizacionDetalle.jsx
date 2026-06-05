import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCotizacionById, updateCotizacion, getClienteById, getConfig } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import generarCotizacionPDF from '../../utils/pdf/pdfCotizacion';

const STATUS_BADGE = { pendiente: 'badge-warning', aprobada: 'badge-success', rechazada: 'badge-danger' };

const CotizacionDetalle = () => {
  const { id } = useParams();
  const [cotizacion, setCotizacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const { canWrite } = useAuth();
  const toast = useToast();

  useEffect(() => {
    getCotizacionById(id).then(data => { setCotizacion(data); setLoading(false); });
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setSaving(true);
    try {
      await updateCotizacion(id, { estado: newStatus });
      setCotizacion(prev => ({ ...prev, estado: newStatus }));
      toast.success('Estado actualizado');
    } catch { toast.error('Error al actualizar'); }
    setSaving(false);
  };

  const handlePDF = async () => {
    setGeneratingPDF(true);
    try {
      const [appearance, company] = await Promise.all([getConfig('appearance'), getConfig('company')]);

      // Datos frescos del cliente (por si actualizaron NIT o dirección)
      let clienteExtra = { nit: cotizacion.clienteNit || '', direccion: cotizacion.clienteDireccion || '' };
      if (cotizacion.clienteId) {
        const clienteFresh = await getClienteById(cotizacion.clienteId);
        if (clienteFresh) clienteExtra = { nit: clienteFresh.nit || '', direccion: clienteFresh.direccion || '' };
      }

      await generarCotizacionPDF(cotizacion, company || {}, appearance?.logoUrl, clienteExtra);
    } catch (err) { toast.error('Error al generar PDF'); console.error(err); }
    setGeneratingPDF(false);
  };

  if (loading) return <div className="spinner" />;
  if (!cotizacion) return <div className="empty-state"><h3>Cotización no encontrada</h3><Link to="/cotizaciones" className="btn btn-primary" style={{ marginTop: 12 }}>Volver</Link></div>;

  const totalServicios = (cotizacion.servicios || []).reduce((s, sv) => s + Number(sv.precio || 0), 0);
  const totalRepuestos = (cotizacion.repuestos || []).reduce((s, r) => s + (r.precioVenta || r.precioUnitario || 0) * r.cantidad, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ marginBottom: 4 }}><Link to="/cotizaciones" className="btn btn-ghost btn-sm">← Cotizaciones</Link></div>
          <h1>Cotización #{String(cotizacion.noCotizacion || '').padStart(4, '0')}</h1>
          <p>{cotizacion.clienteNombre}</p>
        </div>
        <div className="page-header-actions">
          {canWrite() && (
            <select className="form-select" style={{ width: 160 }} value={cotizacion.estado} onChange={e => handleStatusChange(e.target.value)} disabled={saving}>
              <option value="pendiente">Pendiente</option>
              <option value="aprobada">Aprobada</option>
              <option value="rechazada">Rechazada</option>
            </select>
          )}
          <button className="btn btn-accent" onClick={handlePDF} disabled={generatingPDF}>
            {generatingPDF ? 'Generando...' : 'Generar PDF'}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <span className={`badge ${STATUS_BADGE[cotizacion.estado] || 'badge-muted'}`} style={{ fontSize: 13 }}>
          {cotizacion.estado}
        </span>
      </div>

      {/* Cliente y vehículo */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><h2 className="card-title">Cliente y Vehículo</h2></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
          {[
            { label: 'Cliente', value: cotizacion.clienteNombre || '—' },
            { label: 'Marca', value: cotizacion.vehiculoData?.marca || '—' },
            { label: 'Línea', value: cotizacion.vehiculoData?.linea || '—' },
            { label: 'Modelo', value: cotizacion.vehiculoData?.modelo || '—' },
            { label: 'Placa', value: cotizacion.vehiculoData?.placa || '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
              <div style={{ fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Servicios */}
      {cotizacion.servicios && cotizacion.servicios.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h2 className="card-title">Servicios</h2></div>
          <div className="table-wrapper">
            <table className="table responsive-table">
              <thead><tr><th>#</th><th>Descripción</th><th className="text-right">Precio</th></tr></thead>
              <tbody>
                {cotizacion.servicios.map((sv, i) => (
                  <tr key={i}>
                    <td data-label="#">{i + 1}</td>
                    <td data-label="Descripción">{sv.descripcion}</td>
                    <td data-label="Precio" className="text-right">Q{Number(sv.precio || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Repuestos */}
      {cotizacion.repuestos && cotizacion.repuestos.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h2 className="card-title">Repuestos</h2></div>
          <div className="table-wrapper">
            <table className="table responsive-table">
              <thead><tr><th>#</th><th>Nombre</th><th>Marca</th><th>Cant.</th><th className="text-right">P. Venta</th><th className="text-right">Total</th></tr></thead>
              <tbody>
                {cotizacion.repuestos.map((r, i) => (
                  <tr key={i}>
                    <td data-label="#">{i + 1}</td>
                    <td data-label="Nombre">{r.nombre}</td>
                    <td data-label="Marca">{r.marca || '—'}</td>
                    <td data-label="Cant.">{r.cantidad}</td>
                    <td data-label="P. Venta" className="text-right" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Q{Number(r.precioVenta || r.precioUnitario || 0).toFixed(2)}</td>
                    <td data-label="Total" className="text-right" style={{ fontWeight: 700 }}>Q{((r.precioVenta || r.precioUnitario || 0) * r.cantidad).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Totales */}
      <div className="card">
        <div className="card-header"><h2 className="card-title">Total</h2></div>
        <div className="detalle-totales" style={{ maxWidth: 300, marginLeft: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
            <span>Servicios</span><span>Q{totalServicios.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
            <span>Repuestos</span><span>Q{totalRepuestos.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: 20, fontWeight: 800, color: 'var(--color-accent)' }}>
            <span>TOTAL (IVA inc.)</span><span>Q{Number(cotizacion.total || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CotizacionDetalle;
