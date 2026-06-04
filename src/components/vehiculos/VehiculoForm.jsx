import { useState, useEffect } from 'react';
import catalogo from '../../data/catalogoVehiculos.json';

const VehiculoForm = ({ onSubmit, onCancel, initialData = {}, loading }) => {
  const [form, setForm] = useState({
    marca: '', linea: '', complemento: '', modelo: '', placa: '', color: '', chasis: '',
    ...initialData
  });
  const [lineasDisponibles, setLineasDisponibles] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (form.marca) {
      const entry = catalogo.find(c => c.marca === form.marca);
      setLineasDisponibles(entry ? entry.lineas : []);
    } else {
      setLineasDisponibles([]);
    }
  }, [form.marca]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'marca' ? { linea: '' } : {})
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.marca) e.marca = 'La marca es requerida';
    if (!form.linea) e.linea = 'La línea es requerida';
    if (!form.modelo) e.modelo = 'El modelo/año es requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (validate()) onSubmit(form);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 40 }, (_, i) => currentYear - i);

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row form-row-2">
        <div className="form-group">
          <label className="form-label">Marca <span className="required">*</span></label>
          <select name="marca" value={form.marca} onChange={handleChange} className="form-select">
            <option value="">Seleccionar marca...</option>
            {catalogo.map(c => (
              <option key={c.marca} value={c.marca}>{c.marca}</option>
            ))}
          </select>
          {errors.marca && <p className="form-error">{errors.marca}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">Línea <span className="required">*</span></label>
          <select name="linea" value={form.linea} onChange={handleChange} className="form-select" disabled={!form.marca}>
            <option value="">Seleccionar línea...</option>
            {lineasDisponibles.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          {errors.linea && <p className="form-error">{errors.linea}</p>}
        </div>
      </div>

      <div className="form-row form-row-2">
        <div className="form-group">
          <label className="form-label">Complemento <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(opcional)</span></label>
          <input
            name="complemento"
            value={form.complemento}
            onChange={handleChange}
            className="form-input"
            placeholder="Ej: Sport, SE, 4x4..."
          />
        </div>
        <div className="form-group">
          <label className="form-label">Modelo / Año <span className="required">*</span></label>
          <select name="modelo" value={form.modelo} onChange={handleChange} className="form-select">
            <option value="">Seleccionar año...</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {errors.modelo && <p className="form-error">{errors.modelo}</p>}
        </div>
      </div>

      <div className="form-row form-row-3">
        <div className="form-group">
          <label className="form-label">Placa</label>
          <input
            name="placa"
            value={form.placa}
            onChange={handleChange}
            className="form-input"
            placeholder="Ej: P-123ABC"
            style={{ textTransform: 'uppercase' }}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Color</label>
          <input
            name="color"
            value={form.color}
            onChange={handleChange}
            className="form-input"
            placeholder="Ej: Blanco"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Chasis</label>
          <input
            name="chasis"
            value={form.chasis}
            onChange={handleChange}
            className="form-input"
            placeholder="No. de chasis"
            style={{ textTransform: 'uppercase' }}
          />
        </div>
      </div>

      <div className="modal-footer" style={{ padding: '16px 0 0', border: 'none' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Vehículo'}
        </button>
      </div>
    </form>
  );
};

export default VehiculoForm;
