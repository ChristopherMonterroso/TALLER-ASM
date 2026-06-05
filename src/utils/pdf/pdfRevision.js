import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { buildHeader, buildVehicleBlock, buildFirma } from './pdfBase';

const DEFAULT_DESCRIPCION = `En cumplimiento con la solicitud de revisión del vehículo descrito anteriormente, se llevó a cabo la revisión en las instalaciones de Auto Servicios Monterroso, al evaluar el estado del vehículo se ha determinado que se encuentra en buenas condiciones.`;

export { DEFAULT_DESCRIPCION };

const generarRevisionPDF = async (revision, company = {}, logoUrl = null, clienteExtra = {}) => {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.width;

  let y = await buildHeader(doc, company, logoUrl, 'REVISIÓN DE VEHÍCULO', `No. ${String(revision.noRevision || '').padStart(4, '0')}`);

  // Vehicle block — ahora con NIT y dirección frescos
  y = buildVehicleBlock(doc, revision.clienteNombre, revision.vehiculoData, y, {
    nit: clienteExtra.nit || revision.clienteNit || '',
    direccion: clienteExtra.direccion || revision.clienteDireccion || '',
  });

  // Descripcion
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text('Resumen de la Revisión:', 14, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);

  const lines = doc.splitTextToSize(revision.descripcion || DEFAULT_DESCRIPCION, pageW - 28);
  doc.text(lines, 14, y);
  y += lines.length * 5 + 10;

  buildFirma(doc, y);

  doc.save(`revision_${String(revision.noRevision || '').padStart(4, '0')}_${revision.vehiculoData?.placa || 'sin-placa'}.pdf`);
};

export default generarRevisionPDF;
