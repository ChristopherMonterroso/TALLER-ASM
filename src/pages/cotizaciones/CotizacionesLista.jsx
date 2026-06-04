import { useEffect, useState } from 'react';
import { getCotizaciones } from '../../firebase/firestore';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const STATUS_BADGE = { pendiente: 'badge-warning', aprobada: 'badge-success', rechazada: 'badge-danger' };
const STATUS_LABEL = { pendiente: 'Pendiente', aprobada: 'Aprobada', rechazada: 'Rechazada' };

const CotizacionesLista = () => {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { canWrite } = useAuth();

  useEffect(() => {
    getCotizaciones().then(data => { setCotizaciones(data); setLoading(false); });
  }, []);

  const filtered = cotizaciones.filter(c =>
    (c.clienteNombre || '').toLowerCase().includes(search.toLowerCase()) ||
    String(c.noCotizacion || '').includes(search)
  );

  return (
    <div>
      <div className="page-header">
        <div><h1>Cotizaciones</h1><p>{cotizaciones.length} cotizaciones</p></div>
        {canWrite() && <div className="page-header-actions"><Link to="/cotizaciones/nueva" className="btn btn-primary">+ Nueva Cotización</Link></div>}
      </div>
      <div className="card">
        <div className="card-header">
          <input className="form-input" style={{ flex: 1 }} placeholder="Buscar por cliente o No...." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {loading ? <div className="spinner" /> : filtered.length > 0 ? (
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>No.</th><th>Cliente</th><th>Vehículo</th><th>Estado</th><th>Total</th><th></th></tr></thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td><span className="font-mono text-muted">#{String(c.noCotizacion || '').padStart(4, '0')}</span></td>
                    <td><span style={{ fontWeight: 600 }}>{c.clienteNombre || '—'}</span></td>
                    <td>{c.vehiculoData?.marca} {c.vehiculoData?.linea} {c.vehiculoData?.modelo}</td>
                    <td><span className={`badge ${STATUS_BADGE[c.estado] || 'badge-muted'}`}>{STATUS_LABEL[c.estado] || c.estado}</span></td>
                    <td><span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>Q{Number(c.total || 0).toFixed(2)}</span></td>
                    <td><Link to={`/cotizaciones/${c.id}`} className="btn btn-secondary btn-sm">Ver</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            
            <h3>Sin cotizaciones</h3>
            <p>Crea la primera cotización</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CotizacionesLista;
