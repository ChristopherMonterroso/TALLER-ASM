import { useEffect, useState } from 'react';
import { getInventario, addInventarioItem, updateInventarioItem, deleteInventarioItem } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';

const ItemForm = ({ initial = {}, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState({ nombre: '', marca: '', cantidad: 0, precioUnitario: 0, ...initial });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es requerido';
    if (form.cantidad < 0) e.cantidad = 'La cantidad no puede ser negativa';
    if (form.precioUnitario < 0) e.precioUnitario = 'El precio no puede ser negativo';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (validate()) onSubmit({ ...form, cantidad: Number(form.cantidad), precioUnitario: Number(form.precioUnitario) });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row form-row-2">
        <div className="form-group">
          <label className="form-label">Nombre <span className="required">*</span></label>
          <input className="form-input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre del repuesto" />
          {errors.nombre && <p className="form-error">{errors.nombre}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">Marca</label>
          <input className="form-input" value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} placeholder="Marca del repuesto" />
        </div>
      </div>
      <div className="form-row form-row-2">
        <div className="form-group">
          <label className="form-label">Cantidad</label>
          <input className="form-input" type="number" min="0" value={form.cantidad} onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))} />
          {errors.cantidad && <p className="form-error">{errors.cantidad}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">Precio Unitario (Q)</label>
          <input className="form-input" type="number" min="0" step="0.01" value={form.precioUnitario} onChange={e => setForm(f => ({ ...f, precioUnitario: e.target.value }))} />
          {errors.precioUnitario && <p className="form-error">{errors.precioUnitario}</p>}
        </div>
      </div>
      <div className="modal-footer" style={{ padding: '16px 0 0', border: 'none' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </form>
  );
};

const Inventario = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const { canWrite } = useAuth();
  const toast = useToast();

  const load = async () => {
    const data = await getInventario();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter(i =>
    i.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (i.marca || '').toLowerCase().includes(search.toLowerCase())
  );

  const { page, totalPages, paginated, goTo, next, prev } = usePagination(filtered, 25);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (editing) {
        await updateInventarioItem(editing.id, form);
        toast.success('Ítem actualizado');
      } else {
        await addInventarioItem(form);
        toast.success('Ítem agregado');
      }
      setShowModal(false);
      setEditing(null);
      load();
    } catch { toast.error('Error al guardar'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este ítem del inventario?')) return;
    try {
      await deleteInventarioItem(id);
      toast.success('Ítem eliminado');
      load();
    } catch { toast.error('Error al eliminar'); }
  };

  const totalItems = items.reduce((s, i) => s + i.cantidad, 0);
  const totalValue = items.reduce((s, i) => s + (i.cantidad * (i.precioUnitario || 0)), 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Inventario</h1>
          <p>{items.length} productos · {totalItems} unidades · Valor total: Q{totalValue.toFixed(2)}</p>
        </div>
        {canWrite() && (
          <div className="page-header-actions">
            <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>+ Agregar Repuesto</button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ flex: 1 }}>
            <input className="form-input" style={{ paddingLeft: 36, maxWidth: 360 }} placeholder="Buscar por nombre o marca..."
              value={search} onChange={e => { setSearch(e.target.value); goTo(1); }} />
          </div>
        </div>
        {loading ? <div className="spinner" /> : (
          filtered.length > 0 ? (
            <>
              <div className="table-wrapper">
                <table className="table responsive-table">
                  <thead>
                    <tr><th>Nombre</th><th>Marca</th><th>Cantidad</th><th>P. Unitario</th><th>Valor Total</th><th></th></tr>
                  </thead>
                  <tbody>
                    {paginated.map(item => (
                      <tr key={item.id}>
                        <td data-label="Nombre"><span style={{ fontWeight: 600 }}>{item.nombre}</span></td>
                        <td data-label="Marca">{item.marca || <span className="text-muted">—</span>}</td>
                        <td data-label="Cantidad">
                          <span className={`badge ${item.cantidad > 5 ? 'badge-success' : item.cantidad > 0 ? 'badge-warning' : 'badge-danger'}`}>
                            {item.cantidad}
                          </span>
                        </td>
                        <td data-label="P. Unitario">Q{Number(item.precioUnitario || 0).toFixed(2)}</td>
                        <td data-label="Valor Total"><span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>Q{(item.cantidad * (item.precioUnitario || 0)).toFixed(2)}</span></td>
                        <td data-label="Acciones">
                          {canWrite() && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(item); setShowModal(true); }}>Editar</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Eliminar</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={25}
                onNext={next} onPrev={prev} onGoTo={goTo} />
            </>
          ) : (
            <div className="empty-state">
              
              <h3>{search ? 'Sin resultados' : 'Inventario vacío'}</h3>
              <p>{search ? 'Prueba otro término' : 'Agrega el primer repuesto'}</p>
            </div>
          )
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditing(null); }} title={editing ? 'Editar Repuesto' : 'Agregar Repuesto'}>
        <ItemForm initial={editing || {}} onSubmit={handleSave} onCancel={() => { setShowModal(false); setEditing(null); }} loading={saving} />
      </Modal>
    </div>
  );
};

export default Inventario;
