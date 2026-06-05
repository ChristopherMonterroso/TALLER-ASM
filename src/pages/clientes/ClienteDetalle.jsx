import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getClienteById, updateCliente, getVehiculos, addVehiculo, updateVehiculo, deleteVehiculo } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';
import VehiculoForm from '../../components/vehiculos/VehiculoForm';

const ClienteDetalle = () => {
  const { id } = useParams();
  const [cliente, setCliente] = useState(null);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showVehiculoModal, setShowVehiculoModal] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const { canWrite } = useAuth();
  const toast = useToast();

  const load = async () => {
    const [c, v] = await Promise.all([getClienteById(id), getVehiculos(id)]);
    setCliente(c);
    setVehiculos(v);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleUpdateCliente = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateCliente(id, form);
      toast.success('Cliente actualizado');
      setShowClienteModal(false);
      load();
    } catch { toast.error('Error al actualizar'); }
    setSaving(false);
  };

  const openEditCliente = () => {
    setForm({
      nombre: cliente.nombre, telefono: cliente.telefono,
      nit: cliente.nit || '', correo: cliente.correo || '',
      direccion: cliente.direccion || ''
    });
    setShowClienteModal(true);
  };

  const handleSaveVehiculo = async (data) => {
    setSaving(true);
    try {
      if (editingVehiculo) {
        await updateVehiculo(id, editingVehiculo.id, data);
        toast.success('Vehículo actualizado');
      } else {
        await addVehiculo(id, data);
        toast.success('Vehículo agregado');
      }
      setShowVehiculoModal(false);
      setEditingVehiculo(null);
      load();
    } catch { toast.error('Error al guardar vehículo'); }
    setSaving(false);
  };

  const handleDeleteVehiculo = async (vId) => {
    if (!confirm('¿Eliminar este vehículo?')) return;
    try {
      await deleteVehiculo(id, vId);
      toast.success('Vehículo eliminado');
      load();
    } catch { toast.error('Error al eliminar'); }
  };

  if (loading) return <div className="spinner" />;
  if (!cliente) return <div className="empty-state"><h3>Cliente no encontrado</h3><Link to="/clientes" className="btn btn-primary" style={{ marginTop: 12 }}>Volver</Link></div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <Link to="/clientes" className="btn btn-ghost btn-sm">← Clientes</Link>
          </div>
          <h1>{cliente.nombre}</h1>
          <p>Información del cliente y sus vehículos</p>
        </div>
        {canWrite() && (
          <div className="page-header-actions">
            <button className="btn btn-secondary" onClick={openEditCliente}>Editar Cliente</button>
          </div>
        )}
      </div>

      {/* Client Info */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <h2 className="card-title">Datos del Cliente</h2>
        </div>
        <div className="form-row form-row-2" style={{ gap: 16 }}>
          {[
            { label: 'Nombre', value: cliente.nombre },
            { label: 'Teléfono', value: cliente.telefono },
            { label: 'NIT', value: cliente.nit || '—' },
            { label: 'Correo', value: cliente.correo || '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>
        {cliente.direccion && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Dirección</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{cliente.direccion}</div>
          </div>
        )}
      </div>

      {/* Vehicles */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Vehículos ({vehiculos.length})</h2>
          {canWrite() && (
            <button className="btn btn-primary btn-sm" onClick={() => { setEditingVehiculo(null); setShowVehiculoModal(true); }}>
              + Agregar Vehículo
            </button>
          )}
        </div>
        {vehiculos.length > 0 ? (
          <div className="table-wrapper">
            <table className="table responsive-table">
              <thead>
                <tr><th>Marca</th><th>Línea</th><th>Modelo</th><th>Placa</th><th>Color</th><th>Chasis</th><th></th></tr>
              </thead>
              <tbody>
                {vehiculos.map(v => (
                  <tr key={v.id}>
                    <td data-label="Marca"><span style={{ fontWeight: 600 }}>{v.marca}</span></td>
                    <td data-label="Línea">{v.linea} {v.complemento ? <span className="text-muted">({v.complemento})</span> : ''}</td>
                    <td data-label="Modelo">{v.modelo}</td>
                    <td data-label="Placa">{v.placa || <span className="text-muted">—</span>}</td>
                    <td data-label="Color">{v.color || <span className="text-muted">—</span>}</td>
                    <td data-label="Chasis"><span className="font-mono" style={{ fontSize: 12 }}>{v.chasis || '—'}</span></td>
                    <td data-label="Acciones">
                      {canWrite() && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditingVehiculo(v); setShowVehiculoModal(true); }}>Editar</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteVehiculo(v.id)}>Eliminar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            
            <h3>Sin vehículos</h3>
            <p>Agrega el primer vehículo del cliente</p>
          </div>
        )}
      </div>

      {/* Edit client modal */}
      <Modal isOpen={showClienteModal} onClose={() => setShowClienteModal(false)} title="Editar Cliente">
        <form onSubmit={handleUpdateCliente}>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">Nombre <span className="required">*</span></label>
              <input className="form-input" value={form.nombre || ''} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono <span className="required">*</span></label>
              <input className="form-input" value={form.telefono || ''} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
            </div>
          </div>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">NIT</label>
              <input className="form-input" value={form.nit || ''} onChange={e => setForm(f => ({ ...f, nit: e.target.value }))} placeholder="CF o NIT" />
            </div>
            <div className="form-group">
              <label className="form-label">Correo</label>
              <input className="form-input" type="email" value={form.correo || ''} onChange={e => setForm(f => ({ ...f, correo: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Dirección</label>
            <input className="form-input" value={form.direccion || ''} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} placeholder="Zona, colonia, municipio..." />
          </div>
          <div className="modal-footer" style={{ padding: '16px 0 0', border: 'none' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowClienteModal(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>

      {/* Vehicle modal */}
      <Modal
        isOpen={showVehiculoModal}
        onClose={() => { setShowVehiculoModal(false); setEditingVehiculo(null); }}
        title={editingVehiculo ? 'Editar Vehículo' : 'Agregar Vehículo'}
      >
        <VehiculoForm
          initialData={editingVehiculo || {}}
          onSubmit={handleSaveVehiculo}
          onCancel={() => { setShowVehiculoModal(false); setEditingVehiculo(null); }}
          loading={saving}
        />
      </Modal>
    </div>
  );
};

export default ClienteDetalle;
