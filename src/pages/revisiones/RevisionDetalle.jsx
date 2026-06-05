import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRevisionById, getClienteById, getConfig } from '../../firebase/firestore';
import { useToast } from '../../context/ToastContext';
import generarRevisionPDF from '../../utils/pdf/pdfRevision';

const RevisionDetalle = () => {
  const { id } = useParams();
  const [revision, setRevision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const toast = useToast();

  useEffect(() => {
    getRevisionById(id).then(data => { setRevision(data); setLoading(false); });
  }, [id]);

  const handlePDF = async () => {
    setGeneratingPDF(true);
    try {
      const [appearance, company] = await Promise.all([getConfig('appearance'), getConfig('company')]);

      // Datos frescos del cliente (por si actualizaron NIT o dirección)
      let clienteExtra = {
        nit: revision.clienteNit || '',
        direccion: revision.clienteDireccion || '',
      };
      if (revision.clienteId) {
        const clienteFresh = await getClienteById(revision.clienteId);
        if (clienteFresh) {
          clienteExtra = {
            nit: clienteFresh.nit || '',
            direccion: clienteFresh.direccion || '',
          };
        }
      }

      await generarRevisionPDF(revision, company || {}, appearance?.logoUrl, clienteExtra);
    } catch (err) { toast.error('Error al generar PDF'); console.error(err); }
    setGeneratingPDF(false);
  };

  if (loading) return <div className="spinner" />;
  if (!revision) return (
    <div className="empty-state">
      <h3>Revisión no encontrada</h3>
      <Link to="/revisiones" className="btn btn-primary" style={{ marginTop: 12 }}>Volver</Link>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ marginBottom: 4 }}><Link to="/revisiones" className="btn btn-ghost btn-sm">← Revisiones</Link></div>
          <h1>Revisión #{String(revision.noRevision || '').padStart(4, '0')}</h1>
          <p>{revision.clienteNombre || 'Sin cliente'}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-accent" onClick={handlePDF} disabled={generatingPDF}>
            {generatingPDF ? 'Generando...' : 'Generar PDF'}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><h2 className="card-title">Cliente y Vehículo</h2></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
          {[
            { label: 'Cliente', value: revision.clienteNombre || '—' },
            { label: 'Marca', value: revision.vehiculoData?.marca || '—' },
            { label: 'Línea', value: revision.vehiculoData?.linea || '—' },
            { label: 'Modelo', value: revision.vehiculoData?.modelo || '—' },
            { label: 'Placa', value: revision.vehiculoData?.placa || '—' },
            { label: 'Chasis', value: revision.vehiculoData?.chasis || '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
              <div style={{ fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h2 className="card-title">Descripción de la Revisión</h2></div>
        <p style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'var(--color-text-muted)' }}>{revision.descripcion}</p>
      </div>
    </div>
  );
};

export default RevisionDetalle;
