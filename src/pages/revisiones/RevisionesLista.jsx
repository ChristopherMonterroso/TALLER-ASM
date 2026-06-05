import { useEffect, useState } from 'react';
import { getRevisiones } from '../../firebase/firestore';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';

const RevisionesLista = () => {
  const [revisiones, setRevisiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { canWrite } = useAuth();

  useEffect(() => {
    getRevisiones().then(data => { setRevisiones(data); setLoading(false); });
  }, []);

  const filtered = revisiones.filter(r =>
    (r.clienteNombre || '').toLowerCase().includes(search.toLowerCase()) ||
    String(r.noRevision || '').includes(search) ||
    (r.vehiculoData?.placa || '').toLowerCase().includes(search.toLowerCase())
  );

  const { page, totalPages, paginated, goTo, next, prev } = usePagination(filtered, 15);

  return (
    <div>
      <div className="page-header">
        <div><h1>Revisiones de Vehículo</h1><p>{revisiones.length} revisiones</p></div>
        {canWrite() && <div className="page-header-actions"><Link to="/revisiones/nueva" className="btn btn-primary">+ Nueva Revisión</Link></div>}
      </div>
      <div className="card">
        <div className="card-header">
          <input className="form-input" style={{ flex: 1 }} placeholder="Buscar por cliente, No. o placa..."
            value={search} onChange={e => { setSearch(e.target.value); goTo(1); }} />
        </div>
        {loading ? <div className="spinner" /> : filtered.length > 0 ? (
          <>
            <div className="table-wrapper">
              <table className="table responsive-table">
                <thead><tr><th>No.</th><th>Cliente</th><th>Vehículo</th><th>Placa</th><th /></tr></thead>
                <tbody>
                  {paginated.map(r => (
                    <tr key={r.id}>
                      <td data-label="No."><span className="font-mono text-muted">#{String(r.noRevision || '').padStart(4, '0')}</span></td>
                      <td data-label="Cliente"><span style={{ fontWeight: 600 }}>{r.clienteNombre || '—'}</span></td>
                      <td data-label="Vehículo">{r.vehiculoData?.marca} {r.vehiculoData?.linea} {r.vehiculoData?.modelo}</td>
                      <td data-label="Placa">{r.vehiculoData?.placa || <span className="text-muted">—</span>}</td>
                      <td data-label="Acciones"><Link to={`/revisiones/${r.id}`} className="btn btn-secondary btn-sm">Ver</Link></td>
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
            <h3>{search ? 'Sin resultados' : 'Sin revisiones'}</h3>
            <p>Crea la primera revisión de vehículo</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevisionesLista;
