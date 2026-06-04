import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addRevision, getNextNumber } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ClienteVehiculoSelector from '../../components/shared/ClienteVehiculoSelector';
import { DEFAULT_DESCRIPCION } from '../../utils/pdf/pdfRevision';

const NuevaRevision = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [clienteVehiculo, setClienteVehiculo] = useState({ clienteId: null, clienteNombre: '', vehiculoId: null, vehiculoData: {} });
  const [descripcion, setDescripcion] = useState(DEFAULT_DESCRIPCION);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clienteVehiculo.clienteNombre && !clienteVehiculo.vehiculoData?.marca) {
      toast.error('Ingresa datos del cliente o vehículo');
      return;
    }
    setSaving(true);
    try {
      const noRevision = await getNextNumber('revisiones');
      await addRevision({ ...clienteVehiculo, descripcion, noRevision, creadoPor: user?.uid });
      toast.success(`Revisión #${String(noRevision).padStart(4, '0')} creada`);
      navigate('/revisiones');
    } catch { toast.error('Error al crear revisión'); }
    setSaving(false);
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Nueva Revisión de Vehículo</h1><p>Registra la revisión realizada al vehículo</p></div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h2 className="card-title">Cliente y Vehículo</h2></div>
          <ClienteVehiculoSelector onChange={setClienteVehiculo} />
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h2 className="card-title">Descripción de la Revisión</h2></div>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 10 }}>
            Se incluye una descripción base. Puedes modificarla según la revisión realizada.
          </p>
          <textarea
            className="form-textarea"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            rows={12}
            placeholder="Describe la revisión realizada..."
          />
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/revisiones')}>Cancelar</button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>{saving ? 'Guardando...' : 'Crear Revisión'}</button>
        </div>
      </form>
    </div>
  );
};

export default NuevaRevision;
