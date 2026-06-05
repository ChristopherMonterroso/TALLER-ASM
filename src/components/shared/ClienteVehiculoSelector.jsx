import { useState, useEffect } from 'react';
import { getClientes, getVehiculos, addCliente, addVehiculo } from '../../firebase/firestore';
import VehiculoForm from '../vehiculos/VehiculoForm';
import Modal from '../ui/Modal';
import { useToast } from '../../context/ToastContext';

// Compact inline client form
const ClienteInlineForm = ({ onCreated, onCancel }) => {
  const [form, setForm] = useState({ nombre: '', telefono: '', nit: '', correo: '', direccion: '' });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.telefono) { toast.error('Nombre y teléfono son requeridos'); return; }
    setLoading(true);
    try {
      const ref = await addCliente(form);
      toast.success('Cliente creado');
      onCreated({ id: ref.id, ...form });
    } catch { toast.error('Error al crear cliente'); }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row form-row-2">
        <div className="form-group">
          <label className="form-label">Nombre <span className="required">*</span></label>
          <input className="form-input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre completo" />
        </div>
        <div className="form-group">
          <label className="form-label">Teléfono <span className="required">*</span></label>
          <input className="form-input" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="Teléfono" />
        </div>
      </div>
      <div className="form-row form-row-2">
        <div className="form-group">
          <label className="form-label">NIT</label>
          <input className="form-input" value={form.nit} onChange={e => setForm(f => ({ ...f, nit: e.target.value }))} placeholder="CF o NIT" />
        </div>
        <div className="form-group">
          <label className="form-label">Correo</label>
          <input className="form-input" type="email" value={form.correo} onChange={e => setForm(f => ({ ...f, correo: e.target.value }))} placeholder="Correo (opcional)" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Dirección</label>
        <input className="form-input" value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} placeholder="Dirección (opcional)" />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>{loading ? 'Guardando...' : 'Crear Cliente'}</button>
      </div>
    </form>
  );
};

/**
 * ClienteVehiculoSelector
 * Allows picking an existing client+vehicle OR entering data manually.
 * onChange({ clienteId, clienteNombre, vehiculoId, vehiculoData })
 */
const ClienteVehiculoSelector = ({ onChange, value = {} }) => {
  const [mode, setMode] = useState('existente'); // 'existente' | 'manual'
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(value.clienteId || '');
  const [selectedVehiculo, setSelectedVehiculo] = useState(value.vehiculoId || '');
  const [search, setSearch] = useState('');
  const [showCreateCliente, setShowCreateCliente] = useState(false);
  const [showCreateVehiculo, setShowCreateVehiculo] = useState(false);
  const [loadingVehiculo, setLoadingVehiculo] = useState(false);
  const [manualData, setManualData] = useState({
    clienteNombre: '', marca: '', linea: '', modelo: '', placa: '', color: '', chasis: '', nit: '', direccion: ''
  });
  const toast = useToast();

  useEffect(() => {
    getClientes().then(setClientes);
  }, []);

  useEffect(() => {
    if (selectedCliente) {
      getVehiculos(selectedCliente).then(setVehiculos);
    } else {
      setVehiculos([]);
      setSelectedVehiculo('');
    }
  }, [selectedCliente]);

  const filteredClientes = clientes.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (c.telefono || '').includes(search)
  );

  const handleClienteChange = (clienteId) => {
    setSelectedCliente(clienteId);
    setSelectedVehiculo('');
    const c = clientes.find(x => x.id === clienteId);
    onChange({
      clienteId, clienteNombre: c?.nombre || '',
      clienteNit: c?.nit || '', clienteDireccion: c?.direccion || '',
      vehiculoId: '', vehiculoData: {}
    });
  };

  const handleVehiculoChange = (vehiculoId) => {
    setSelectedVehiculo(vehiculoId);
    const v = vehiculos.find(x => x.id === vehiculoId);
    const c = clientes.find(x => x.id === selectedCliente);
    onChange({
      clienteId: selectedCliente, clienteNombre: c?.nombre || '',
      clienteNit: c?.nit || '', clienteDireccion: c?.direccion || '',
      vehiculoId, vehiculoData: v || {}
    });
  };

  const handleClienteCreated = (cliente) => {
    setClientes(prev => [cliente, ...prev]);
    setSelectedCliente(cliente.id);
    setShowCreateCliente(false);
    onChange({
      clienteId: cliente.id, clienteNombre: cliente.nombre,
      clienteNit: cliente.nit || '', clienteDireccion: cliente.direccion || '',
      vehiculoId: '', vehiculoData: {}
    });
  };

  const handleVehiculoCreated = async (vData) => {
    setLoadingVehiculo(true);
    try {
      const ref = await addVehiculo(selectedCliente, vData);
      const newV = { id: ref.id, ...vData };
      setVehiculos(prev => [...prev, newV]);
      setSelectedVehiculo(newV.id);
      setShowCreateVehiculo(false);
      const c = clientes.find(x => x.id === selectedCliente);
      onChange({
        clienteId: selectedCliente, clienteNombre: c?.nombre || '',
        clienteNit: c?.nit || '', clienteDireccion: c?.direccion || '',
        vehiculoId: newV.id, vehiculoData: newV
      });
      toast.success('Vehículo agregado');
    } catch { toast.error('Error al crear vehículo'); }
    setLoadingVehiculo(false);
  };

  const handleManualChange = (e) => {
    const next = { ...manualData, [e.target.name]: e.target.value };
    setManualData(next);
    onChange({
      clienteId: null, clienteNombre: next.clienteNombre,
      clienteNit: next.nit || '', clienteDireccion: next.direccion || '',
      vehiculoId: null, vehiculoData: next
    });
  };

  return (
    <div>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          className={`btn btn-sm ${mode === 'existente' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setMode('existente')}
        >Cliente registrado</button>
        <button
          type="button"
          className={`btn btn-sm ${mode === 'manual' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setMode('manual')}
        >Datos manuales</button>
      </div>

      {mode === 'existente' && (
        <div>
          {!showCreateCliente ? (
            <>
              <div className="form-group">
                <label className="form-label">Buscar cliente</label>
                <input
                  className="form-input"
                  placeholder="Nombre o teléfono..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Cliente <span className="required">*</span></label>
                <select
                  className="form-select"
                  value={selectedCliente}
                  onChange={e => {
                    if (e.target.value === '__create__') {
                      setShowCreateCliente(true);
                    } else {
                      handleClienteChange(e.target.value);
                    }
                  }}
                >
                  <option value="">Seleccionar cliente...</option>
                  <option value="__create__">+ Crear nuevo cliente</option>
                  {filteredClientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} — {c.telefono}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div className="card" style={{ padding: 16, marginBottom: 12, border: '1px solid var(--color-primary)' }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--color-primary)' }}>
                ¿Deseas crear un nuevo cliente?
              </p>
              <ClienteInlineForm onCreated={handleClienteCreated} onCancel={() => setShowCreateCliente(false)} />
            </div>
          )}

          {selectedCliente && !showCreateCliente && (
            <div className="form-group">
              <label className="form-label">Vehículo</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  className="form-select"
                  value={selectedVehiculo}
                  onChange={e => handleVehiculoChange(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="">Seleccionar vehículo...</option>
                  {vehiculos.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.marca} {v.linea} {v.modelo} {v.placa ? `— ${v.placa}` : ''}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCreateVehiculo(true)}>
                  + Vehículo
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'manual' && (
        <div>
          <div className="form-group">
            <label className="form-label">Nombre del cliente</label>
            <input className="form-input" name="clienteNombre" value={manualData.clienteNombre} onChange={handleManualChange} placeholder="Nombre" />
          </div>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">NIT <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(opcional)</span></label>
              <input className="form-input" name="nit" value={manualData.nit || ''} onChange={handleManualChange} placeholder="CF o NIT" />
            </div>
            <div className="form-group">
              <label className="form-label">Dirección <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(opcional)</span></label>
              <input className="form-input" name="direccion" value={manualData.direccion || ''} onChange={handleManualChange} placeholder="Dirección (opcional)" />
            </div>
          </div>
          <div className="form-row form-row-3">
            <div className="form-group">
              <label className="form-label">Marca</label>
              <input className="form-input" name="marca" value={manualData.marca} onChange={handleManualChange} placeholder="Marca" />
            </div>
            <div className="form-group">
              <label className="form-label">Línea</label>
              <input className="form-input" name="linea" value={manualData.linea} onChange={handleManualChange} placeholder="Línea" />
            </div>
            <div className="form-group">
              <label className="form-label">Modelo/Año</label>
              <input className="form-input" name="modelo" value={manualData.modelo} onChange={handleManualChange} placeholder="2022" />
            </div>
          </div>
          <div className="form-row form-row-3">
            <div className="form-group">
              <label className="form-label">Placa</label>
              <input className="form-input" name="placa" value={manualData.placa} onChange={handleManualChange} placeholder="P-123ABC" />
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <input className="form-input" name="color" value={manualData.color} onChange={handleManualChange} placeholder="Color" />
            </div>
            <div className="form-group">
              <label className="form-label">Chasis</label>
              <input className="form-input" name="chasis" value={manualData.chasis} onChange={handleManualChange} placeholder="Chasis" />
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create vehicle */}
      <Modal isOpen={showCreateVehiculo} onClose={() => setShowCreateVehiculo(false)} title="Agregar Vehículo">
        <VehiculoForm
          onSubmit={handleVehiculoCreated}
          onCancel={() => setShowCreateVehiculo(false)}
          loading={loadingVehiculo}
        />
      </Modal>
    </div>
  );
};

export default ClienteVehiculoSelector;
