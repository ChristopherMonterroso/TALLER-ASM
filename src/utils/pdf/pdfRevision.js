import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { buildHeader, buildVehicleBlock, buildFirma } from './pdfBase';

const DEFAULT_DESCRIPCION = `Se realizó inspección general del vehículo verificando los siguientes sistemas:

• Sistema de frenos: revisión de pastillas, discos y nivel de líquido de frenos.
• Sistema de motor: revisión de niveles de aceite, refrigerante y correa de distribución.
• Sistema eléctrico: revisión de batería, luces y sistema de arranque.
• Sistema de suspensión: revisión de amortiguadores, rótulas y terminales.
• Sistema de dirección: revisión de caja de dirección y cremallera.
• Neumáticos: revisión de presión y desgaste.

Observaciones generales: (completar según revisión).`;

export { DEFAULT_DESCRIPCION };

const generarRevisionPDF = async (revision, company = {}, logoUrl = null) => {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.width;

  let y = await buildHeader(doc, company, logoUrl, 'REVISIÓN DE VEHÍCULO', `No. ${String(revision.noRevision || '').padStart(4, '0')}`);

  // Vehicle block
  y = buildVehicleBlock(doc, revision.clienteNombre, revision.vehiculoData, y);

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
