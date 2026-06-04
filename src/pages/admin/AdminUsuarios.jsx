import { useEffect, useState } from 'react';
import { getAllUsers, setUserData } from '../../firebase/firestore';
import { createAuthUser } from '../../firebase/auth';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';

const DOMAIN = '@asm.com';

const UserForm = ({ initial = {}, onSubmit, onCancel, loading, isNew }) => {
  const defaultPerms = { read: true, write: false };

  // For display: strip @asm.com from email to show only username
  const initialUsername = initial.email
    ? initial.email.replace(DOMAIN, '')
    : '';

  const [form, setForm] = useState(() => ({
    displayName: initial.displayName || '',
    username: initialUsername,
    role: initial.role || 'employee',
    permissions: { ...defaultPerms, ...(initial.permissions || {}) },
    active: initial.active !== undefined ? initial.active : true,
    password: '',
  }));

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('perm_')) {
      const key = name.replace('perm_', '');
      setForm(f => ({ ...f, permissions: { ...f.permissions, [key]: checked } }));
    } else {
      setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const email = form.username.includes('@') ? form.username : `${form.username}${DOMAIN}`;
    onSubmit({ ...form, email });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row form-row-2">
        <div className="form-group">
          <label className="form-label">Nombre completo <span className="required">*</span></label>
          <input name="displayName" value={form.displayName} onChange={handleChange} className="form-input" placeholder="Nombre completo" required />
        </div>
        <div className="form-group">
          <label className="form-label">Usuario <span className="required">*</span></label>
          <div style={{ position: 'relative' }}>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              className="form-input"
              placeholder="nombre.usuario"
              required
              disabled={!isNew}
              style={{ paddingRight: isNew && form.username && !form.username.includes('@') ? '100px' : '14px' }}
            />
            {isNew && form.username && !form.username.includes('@') && (
              <span style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)', fontSize: 13, pointerEvents: 'none',
                fontStyle: 'italic', whiteSpace: 'nowrap',
              }}>
                {DOMAIN}
              </span>
            )}
            {!isNew && (
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                {form.username}{DOMAIN}
              </p>
            )}
          </div>
        </div>
      </div>

      {isNew && (
        <div className="form-group">
          <label className="form-label">Contraseña temporal <span className="required">*</span></label>
          <input name="password" value={form.password} onChange={handleChange} className="form-input" type="password" placeholder="Mínimo 6 caracteres" required minLength={6} />
        </div>
      )}

      <div className="form-row form-row-2">
        <div className="form-group">
          <label className="form-label">Rol</label>
          <select name="role" value={form.role} onChange={handleChange} className="form-select">
            <option value="admin">Administrador</option>
            <option value="employee">Empleado</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Estado</label>
          <select name="active" value={form.active ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, active: e.target.value === 'true' }))} className="form-select">
            <option value="true">Activo</option>
            <option value="false">Desactivado</option>
          </select>
        </div>
      </div>

      {form.role === 'employee' && (
        <div className="form-group">
          <label className="form-label">Permisos</label>
          <div style={{ display: 'flex', gap: 20, padding: '12px 16px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" name="perm_read" checked={form.permissions.read} onChange={handleChange} />
              Lectura
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" name="perm_write" checked={form.permissions.write} onChange={handleChange} />
              Escritura
            </label>
          </div>
        </div>
      )}

      <div className="modal-footer" style={{ padding: '16px 0 0', border: 'none' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </form>
  );
};

const AdminUsuarios = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const load = async () => {
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (editing) {
        const { password, email, username, ...updateData } = form;
        await setUserData(editing.id, updateData);
        toast.success('Usuario actualizado');
      } else {
        const cred = await createAuthUser(form.email, form.password);
        await setUserData(cred.user.uid, {
          displayName: form.displayName,
          email: form.email,
          role: form.role,
          permissions: form.permissions,
          active: form.active,
        });
        toast.success(`Usuario creado: ${form.email}`);
      }
      setShowModal(false);
      setEditing(null);
      load();
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use' ? 'Ese usuario ya existe'
        : err.code === 'auth/weak-password' ? 'La contraseña debe tener mínimo 6 caracteres'
        : 'Error al guardar usuario';
      toast.error(msg);
    }
    setSaving(false);
  };

  // Show username without domain in the table
  const displayUsername = (email) => email ? email.replace(DOMAIN, '') : '—';

  const roleLabel = (r) => r === 'admin' ? 'Admin' : 'Empleado';
  const permLabel = (u) => {
    if (u.role === 'admin') return 'Acceso total';
    if (u.permissions?.write) return 'Lectura + Escritura';
    if (u.permissions?.read) return 'Solo lectura';
    return 'Sin permisos';
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Gestión de Usuarios</h1><p>{users.length} usuarios registrados</p></div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>+ Nuevo Usuario</button>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner" /> : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Permisos</th><th>Estado</th><th></th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td><span style={{ fontWeight: 600 }}>{u.displayName}</span></td>
                    <td>
                      <span className="font-mono" style={{ fontSize: 13 }}>{displayUsername(u.email)}</span>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{DOMAIN}</span>
                    </td>
                    <td>{roleLabel(u.role)}</td>
                    <td><span className="badge badge-primary">{permLabel(u)}</span></td>
                    <td>
                      <span className={`badge ${u.active ? 'badge-success' : 'badge-danger'}`}>
                        {u.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(u); setShowModal(true); }}>Editar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditing(null); }}
        title={editing ? 'Editar Usuario' : 'Nuevo Usuario'}
      >
        <UserForm
          initial={editing || {}}
          isNew={!editing}
          onSubmit={handleSave}
          onCancel={() => { setShowModal(false); setEditing(null); }}
          loading={saving}
        />
      </Modal>
    </div>
  );
};

export default AdminUsuarios;
