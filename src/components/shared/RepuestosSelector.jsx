import { useState } from 'react';
import { getInventario } from '../../firebase/firestore';
import Modal from '../ui/Modal';

const RepuestosSelector = ({ repuestos, onChange }) => {
  const [showModal, setShowModal] = useState(false);
  const [inventario, setInventario] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingInv, setLoadingInv] = useState(false);

  const openModal = async () => {
    setShowModal(true);
    setLoadingInv(true);
    const items = await getInventario();
    setInventario(items);
    setLoadingInv(false);
  };

  const addFromInventario = (item) => {
    const exists = repuestos.find(r => r.inventarioId === item.id);
    if (exists) return;
    onChange([...repuestos, {
      inventarioId: item.id,
      nombre: item.nombre,
      marca: item.marca,
      cantidad: 1,
      precioUnitario: item.precioUnitario,
      precioVenta: item.precioUnitario,
    }]);
    setShowModal(false);
  };

  const addManual = () => {
    onChange([...repuestos, {
      inventarioId: null,
      nombre: '',
      marca: '',
      cantidad: 1,
      precioUnitario: 0,
      precioVenta: 0,
    }]);
  };

  const updateRepuesto = (idx, field, value) => {
    const updated = repuestos.map((r, i) => i === idx ? { ...r, [field]: value } : r);
    onChange(updated);
  };

  const removeRepuesto = (idx) => {
    onChange(repuestos.filter((_, i) => i !== idx));
  };

  const filtered = inventario.filter(i =>
    i.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (i.marca || '').toLowerCase().includes(search.toLowerCase())
  );

  const total = repuestos.reduce((s, r) => s + (Number(r.precioVenta) || 0) * (Number(r.cantidad) || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={openModal}>
          Agregar del inventario
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={addManual}>
          Agregar manual
        </button>
      </div>

      {repuestos.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px 100px 100px 36px', gap: 8, padding: '6px 8px', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>Descripción</span><span>Marca</span><span>Cant.</span><span>P. Compra</span><span>P. Venta</span><span></span>
          </div>
          {repuestos.map((r, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px 100px 100px 36px', gap: 8, padding: '6px 8px', background: 'var(--color-surface-2)', borderRadius: 8, marginBottom: 6, border: '1px solid var(--color-border)', alignItems: 'center' }}>
              <input
                className="form-input"
                value={r.nombre}
                onChange={e => updateRepuesto(idx, 'nombre', e.target.value)}
                placeholder="Nombre"
                style={{ padding: '6px 10px', fontSize: 13 }}
              />
              <input
                className="form-input"
                value={r.marca}
                onChange={e => updateRepuesto(idx, 'marca', e.target.value)}
                placeholder="Marca"
                style={{ padding: '6px 10px', fontSize: 13 }}
              />
              <input
                className="form-input"
                type="number"
                min="1"
                value={r.cantidad}
                onChange={e => updateRepuesto(idx, 'cantidad', Number(e.target.value))}
                style={{ padding: '6px 10px', fontSize: 13 }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--color-text-muted)' }}>
                <span>Q</span>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={r.precioUnitario}
                  onChange={e => updateRepuesto(idx, 'precioUnitario', Number(e.target.value))}
                  style={{ padding: '6px 10px', fontSize: 13 }}
                  readOnly={!!r.inventarioId}
                  title={r.inventarioId ? 'Precio de costo del inventario' : ''}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>Q</span>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={r.precioVenta}
                  onChange={e => updateRepuesto(idx, 'precioVenta', Number(e.target.value))}
                  style={{ padding: '6px 10px', fontSize: 13, borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
                  title="Precio de venta al cliente"
                />
              </div>
              <button type="button" className="btn btn-danger btn-icon btn-sm" onClick={() => removeRepuesto(idx)}>✕</button>
            </div>
          ))}
          <div style={{ textAlign: 'right', marginTop: 8, fontWeight: 700, fontSize: 15, color: 'var(--color-accent)' }}>
            Total repuestos: Q{total.toFixed(2)}
          </div>
        </div>
      )}

      {repuestos.length === 0 && (
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, fontStyle: 'italic' }}>Sin repuestos agregados.</p>
      )}

      {/* Inventario modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Seleccionar del Inventario" size="lg">
        <div className="form-group">
          <input className="form-input" placeholder="Buscar por nombre o marca..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {loadingInv ? (
          <div className="spinner" />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Nombre</th><th>Marca</th><th>Stock</th><th>P. Unitario</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id}>
                    <td>{item.nombre}</td>
                    <td>{item.marca || '—'}</td>
                    <td>
                      <span className={`badge ${item.cantidad > 0 ? 'badge-success' : 'badge-danger'}`}>
                        {item.cantidad}
                      </span>
                    </td>
                    <td>Q{Number(item.precioUnitario || 0).toFixed(2)}</td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => addFromInventario(item)}
                        disabled={item.cantidad === 0}
                      >Agregar</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-muted" style={{ padding: 24 }}>Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RepuestosSelector;
