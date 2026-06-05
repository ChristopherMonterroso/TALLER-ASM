import { useEffect, useState } from 'react';
import { getCotizaciones } from '../../firebase/firestore';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';

const STATUS_BADGE = { pendiente: 'badge-warning', aprobada: 'badge-success', rechazada: 'badge-danger' };
const STATUS_LABEL = { pendiente: 'Pendiente', aprobada: 'Aprobada', rechazada: 'Rechazada' };

const CotizacionesLista = () => {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { canWrite } = useAuth();

  useEffect(() => {
    getCotizaciones().then(data => { setCotizaciones(data); setLoading(false); });
  }, []);

  const filtered = cotizaciones.filter(c => {
    const matchSearch = (c.clienteNombre || '').toLowerCase().includes(search.toLowerCase()) ||
      String(c.noCotizacion || '').includes(search) ||
      (c.vehiculoData?.placa || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.estado === statusFilter;
    return matchSearch && matchStatus;
  });

  const { page, totalPages, paginated, goTo, next, prev } = usePagination(filtered, 15);

  return (
    <div>
      <div className="page-header">
        <div><h1>Cotizaciones</h1><p>{cotizaciones.length} cotizaciones</p></div>
        {canWrite() && <div className="page-header-actions"><Link to="/cotizaciones/nueva" className="btn btn-primary">+ Nueva Cotización</Link></div>}
      </div>
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <input className="form-input" style={{ flex: 1, minWidth: 180 }} placeholder="Buscar por cliente, No. o placa..."
            value={search} onChange={e => { setSearch(e.target.value); goTo(1); }} />
          <select className="form-select" style={{ width: 150 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); goTo(1); }}>
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobada">Aprobada</option>
            <option value="rechazada">Rechazada</option>
          </select>
        </div>
        {loading ? <div className="spinner" /> : filtered.length > 0 ? (
          <>
            <div className="table-wrapper">
              <table className="table responsive-table">
                <thead><tr><th>No.</th><th>Cliente</th><th>Vehículo</th><th>Estado</th><th>Total</th><th /></tr></thead>
                <tbody>
                  {paginated.map(c => (
                    <tr key={c.id}>
                      <td data-label="No."><span className="font-mono text-muted">#{String(c.noCotizacion || '').padStart(4, '0')}</span></td>
                      <td data-label="Cliente"><span style={{ fontWeight: 600 }}>{c.clienteNombre || '—'}</span></td>
                      <td data-label="Vehículo">{c.vehiculoData?.marca} {c.vehiculoData?.linea} {c.vehiculoData?.modelo}</td>
                      <td data-label="Estado"><span className={`badge ${STATUS_BADGE[c.estado] || 'badge-muted'}`}>{STATUS_LABEL[c.estado] || c.estado}</span></td>
                      <td data-label="Total"><span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>Q{Number(c.total || 0).toFixed(2)}</span></td>
                      <td data-label="Acciones"><Link to={`/cotizaciones/${c.id}`} className="btn btn-secondary btn-sm">Ver</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={15}
              onNext={next} onPrev={prev} onGoTo={goTo} />
          </>
        ) : (
          <div className="empty-state">
            <h3>{search || statusFilter !== 'all' ? 'Sin resultados' : 'Sin cotizaciones'}</h3>
            <p>Crea la primera cotización</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CotizacionesLista;
