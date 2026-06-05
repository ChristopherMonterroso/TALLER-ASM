import { useEffect, useState } from 'react';
import { getOrdenes } from '../../firebase/firestore';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';

const STATUS_BADGE = { pendiente: 'badge-warning', en_proceso: 'badge-primary', terminado: 'badge-success' };
const STATUS_LABEL = { pendiente: 'Pendiente', en_proceso: 'En proceso', terminado: 'Terminado' };

const OrdenesLista = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { canWrite } = useAuth();

  useEffect(() => {
    getOrdenes().then(data => { setOrdenes(data); setLoading(false); });
  }, []);

  const filtered = ordenes.filter(o => {
    const matchSearch = (o.clienteNombre || '').toLowerCase().includes(search.toLowerCase()) ||
      String(o.noOrden || '').includes(search) ||
      (o.vehiculoData?.placa || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.estado === statusFilter;
    return matchSearch && matchStatus;
  });

  const { page, totalPages, paginated, goTo, next, prev } = usePagination(filtered, 15);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Órdenes de Trabajo</h1>
          <p>{ordenes.length} órdenes registradas</p>
        </div>
        {canWrite() && (
          <div className="page-header-actions">
            <Link to="/ordenes/nueva" className="btn btn-primary">+ Nueva Orden</Link>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <input
            className="form-input"
            style={{ flex: 1, minWidth: 200 }}
            placeholder="Buscar por cliente, No. orden o placa..."
            value={search}
            onChange={e => { setSearch(e.target.value); goTo(1); }}
          />
          <select className="form-select" style={{ width: 160 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); goTo(1); }}>
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_proceso">En proceso</option>
            <option value="terminado">Terminado</option>
          </select>
        </div>
        {loading ? <div className="spinner" /> : (
          filtered.length > 0 ? (
            <>
              <div className="table-wrapper">
                <table className="table responsive-table">
                  <thead>
                    <tr><th>No.</th><th>Cliente</th><th>Vehículo</th><th>Placa</th><th>Estado</th><th>Total</th><th /></tr>
                  </thead>
                  <tbody>
                    {paginated.map(o => (
                      <tr key={o.id}>
                        <td data-label="No."><span className="font-mono text-muted">#{String(o.noOrden || '').padStart(4, '0')}</span></td>
                        <td data-label="Cliente"><span style={{ fontWeight: 600 }}>{o.clienteNombre || '—'}</span></td>
                        <td data-label="Vehículo">{o.vehiculoData?.marca} {o.vehiculoData?.linea} {o.vehiculoData?.modelo}</td>
                        <td data-label="Placa">{o.vehiculoData?.placa || <span className="text-muted">—</span>}</td>
                        <td data-label="Estado"><span className={`badge ${STATUS_BADGE[o.estado] || 'badge-muted'}`}>{STATUS_LABEL[o.estado] || o.estado}</span></td>
                        <td data-label="Total"><span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>Q{Number(o.total || 0).toFixed(2)}</span></td>
                        <td data-label="Acciones"><Link to={`/ordenes/${o.id}`} className="btn btn-secondary btn-sm">Ver</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={page} totalPages={totalPages} total={filtered.length} pageSize={15}
                onNext={next} onPrev={prev} onGoTo={goTo}
              />
            </>
          ) : (
            <div className="empty-state">
              <h3>{search || statusFilter !== 'all' ? 'Sin resultados' : 'Sin órdenes'}</h3>
              <p>Crea una nueva orden de trabajo</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default OrdenesLista;
