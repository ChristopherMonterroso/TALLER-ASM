import { useEffect, useState } from 'react';
import { getClientes, addCliente, updateCliente } from '../../firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';

const ClienteForm = ({ initial = {}, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState({ nombre: '', telefono: '', nit: '', correo: '', direccion: '', ...initial });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(err => ({ ...err, [e.target.name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es requerido';
    if (!form.telefono.trim()) e.telefono = 'El teléfono es requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (validate()) onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row form-row-2">
        <div className="form-group">
          <label className="form-label">Nombre <span className="required">*</span></label>
          <input name="nombre" value={form.nombre} onChange={handleChange} className="form-input" placeholder="Nombre completo" />
          {errors.nombre && <p className="form-error">{errors.nombre}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">Teléfono <span className="required">*</span></label>
          <input name="telefono" value={form.telefono} onChange={handleChange} className="form-input" placeholder="+502 1234 5678" />
          {errors.telefono && <p className="form-error">{errors.telefono}</p>}
        </div>
      </div>
      <div className="form-row form-row-2">
        <div className="form-group">
          <label className="form-label">NIT <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(opcional)</span></label>
          <input name="nit" value={form.nit} onChange={handleChange} className="form-input" placeholder="CF o NIT" />
        </div>
        <div className="form-group">
          <label className="form-label">Correo <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(opcional)</span></label>
          <input name="correo" value={form.correo} onChange={handleChange} className="form-input" type="email" placeholder="correo@ejemplo.com" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Dirección <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(opcional)</span></label>
        <input name="direccion" value={form.direccion} onChange={handleChange} className="form-input" placeholder="Zona, colonia, municipio..." />
      </div>
      <div className="modal-footer" style={{ padding: '16px 0 0', border: 'none' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </form>
  );
};

const ClientesLista = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const { canWrite } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const load = async () => {
    const data = await getClientes();
    setClientes(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = clientes.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (c.telefono || '').includes(search) ||
    (c.nit || '').includes(search)
  );

  const { page, totalPages, paginated, goTo, next, prev } = usePagination(filtered, 20);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (editing) {
        await updateCliente(editing.id, form);
        toast.success('Cliente actualizado');
      } else {
        await addCliente(form);
        toast.success('Cliente creado');
      }
      setShowModal(false);
      setEditing(null);
      load();
    } catch { toast.error('Error al guardar'); }
    setSaving(false);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Clientes</h1>
          <p>{clientes.length} clientes registrados</p>
        </div>
        <div className="page-header-actions">
          {canWrite() && (
            <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
              + Nuevo Cliente
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-bar" style={{ maxWidth: '100%', flex: 1 }}>
            <input
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Buscar por nombre, teléfono o NIT..."
              value={search}
              onChange={e => { setSearch(e.target.value); goTo(1); }}
            />
          </div>
        </div>
        {loading ? <div className="spinner" /> : (
          filtered.length > 0 ? (
            <>
              <div className="table-wrapper">
                <table className="table responsive-table">
                  <thead>
                    <tr><th>Nombre</th><th>Teléfono</th><th>NIT</th><th>Correo</th><th /></tr>
                  </thead>
                  <tbody>
                    {paginated.map(c => (
                      <tr key={c.id}>
                        <td data-label="Nombre"><span style={{ fontWeight: 600 }}>{c.nombre}</span></td>
                        <td data-label="Teléfono">{c.telefono}</td>
                        <td data-label="NIT">{c.nit || <span className="text-muted">—</span>}</td>
                        <td data-label="Correo">{c.correo || <span className="text-muted">—</span>}</td>
                        <td data-label="Acciones">
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/clientes/${c.id}`)}>Ver</button>
                            {canWrite() && (
                              <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(c); setShowModal(true); }}>Editar</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={20}
                onNext={next} onPrev={prev} onGoTo={goTo} />
            </>
          ) : (
            <div className="empty-state">
              <h3>{search ? 'Sin resultados' : 'Sin clientes'}</h3>
              <p>{search ? 'Prueba con otro término' : 'Agrega tu primer cliente'}</p>
            </div>
          )
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditing(null); }}
        title={editing ? 'Editar Cliente' : 'Nuevo Cliente'}
      >
        <ClienteForm
          initial={editing || {}}
          onSubmit={handleSave}
          onCancel={() => { setShowModal(false); setEditing(null); }}
          loading={saving}
        />
      </Modal>
    </div>
  );
};

export default ClientesLista;
