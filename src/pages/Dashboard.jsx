import { useEffect, useState } from 'react';
import { getClientes, getOrdenes, getCotizaciones, getRevisiones, getInventario } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const StatCard = ({ icon, label, value, color, to }) => (
  <Link to={to} style={{ textDecoration: 'none' }}>
    <div className="stat-card" style={{ cursor: 'pointer' }}>
      <div className="stat-icon" style={{ background: `${color}20`, fontSize: 22 }}>{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </Link>
);

const Dashboard = () => {
  const { userData } = useAuth();
  const [stats, setStats] = useState({ clientes: 0, ordenes: 0, cotizaciones: 0, revisiones: 0, inventario: 0 });
  const [recentOrdenes, setRecentOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [clientes, ordenes, cotizaciones, revisiones, inventario] = await Promise.all([
        getClientes(), getOrdenes(), getCotizaciones(), getRevisiones(), getInventario()
      ]);
      setStats({ clientes: clientes.length, ordenes: ordenes.length, cotizaciones: cotizaciones.length, revisiones: revisiones.length, inventario: inventario.length });
      setRecentOrdenes(ordenes.slice(0, 6));
      setLoading(false);
    };
    load();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  const statusColor = { pendiente: 'warning', en_proceso: 'primary', terminado: 'success' };
  const statusLabel = { pendiente: 'Pendiente', en_proceso: 'En proceso', terminado: 'Terminado' };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>
          {greeting}, {userData?.displayName?.split(' ')[0] || 'usuario'} 👋
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
          {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })} · Resumen del sistema
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon="" label="Clientes" value={stats.clientes} color="var(--color-primary)" to="/clientes" />
        <StatCard icon="" label="Órdenes" value={stats.ordenes} color="var(--color-accent)" to="/ordenes" />
        <StatCard icon="" label="Cotizaciones" value={stats.cotizaciones} color="var(--color-success)" to="/cotizaciones" />
        <StatCard icon="" label="Revisiones" value={stats.revisiones} color="#A78BFA" to="/revisiones" />
        <StatCard icon="" label="Items Inventario" value={stats.inventario} color="var(--color-warning)" to="/inventario" />
      </div>

      {/* Recent orders */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Órdenes Recientes</h2>
          <Link to="/ordenes/nueva" className="btn btn-primary btn-sm">+ Nueva Orden</Link>
        </div>
        {recentOrdenes.length > 0 ? (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>No.</th><th>Cliente</th><th>Vehículo</th><th>Estado</th><th>Total</th><th></th>
                </tr>
              </thead>
              <tbody>
                {recentOrdenes.map(o => (
                  <tr key={o.id}>
                    <td><span className="font-mono text-muted">#{String(o.noOrden || '').padStart(4, '0')}</span></td>
                    <td><span style={{ fontWeight: 600 }}>{o.clienteNombre}</span></td>
                    <td>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
                        {o.vehiculoData?.marca} {o.vehiculoData?.linea} {o.vehiculoData?.modelo}
                        {o.vehiculoData?.placa ? ` — ${o.vehiculoData.placa}` : ''}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${statusColor[o.estado] || 'muted'}`}>
                        {statusLabel[o.estado] || o.estado}
                      </span>
                    </td>
                    <td><span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>Q{Number(o.total || 0).toFixed(2)}</span></td>
                    <td><Link to={`/ordenes/${o.id}`} className="btn btn-ghost btn-sm">Ver</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            
            <h3>Sin órdenes aún</h3>
            <p>Crea la primera orden de trabajo</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
