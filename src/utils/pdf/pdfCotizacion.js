import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { buildHeader, buildVehicleBlock, buildRepuestosTable, buildFirma, formatQ } from './pdfBase';

const generarCotizacionPDF = async (cotizacion, company = {}, logoUrl = null, clienteExtra = {}) => {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.width;

  let y = await buildHeader(doc, company, logoUrl, 'COTIZACIÓN', `No. ${String(cotizacion.noCotizacion || '').padStart(4, '0')}`);

  // Vehicle block — incluye NIT y dirección frescos
  y = buildVehicleBlock(doc, cotizacion.clienteNombre, cotizacion.vehiculoData, y, {
    nit: clienteExtra.nit || cotizacion.clienteNit || '',
    direccion: clienteExtra.direccion || cotizacion.clienteDireccion || '',
  });

  // Servicios
  if (cotizacion.servicios && cotizacion.servicios.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text('Servicios', 14, y);

    autoTable(doc, {
      startY: y + 4,
      head: [['#', 'Descripción del Servicio', 'Precio']],
      body: cotizacion.servicios.map((s, i) => [i + 1, s.descripcion, formatQ(s.precio)]),
      theme: 'striped',
      headStyles: { fillColor: [26, 54, 93], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
      margin: { left: 14, right: 14 },
      columnStyles: { 0: { halign: 'center', cellWidth: 12 }, 2: { halign: 'right', cellWidth: 36 } },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Repuestos
  y = buildRepuestosTable(doc, cotizacion.repuestos, y);

  // Totales
  const totalServicios = (cotizacion.servicios || []).reduce((s, sv) => s + Number(sv.precio || 0), 0);
  const totalRepuestos = (cotizacion.repuestos || []).reduce(
    (s, r) => s + (r.precioVenta || r.precioUnitario || 0) * r.cantidad, 0
  );
  const total = Number(cotizacion.total || totalServicios + totalRepuestos);

  const totalsX = pageW - 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);

  doc.text('Subtotal servicios:', totalsX - 65, y);
  doc.text(formatQ(totalServicios), totalsX, y, { align: 'right' });
  y += 7;

  doc.text('Subtotal repuestos:', totalsX - 65, y);
  doc.text(formatQ(totalRepuestos), totalsX, y, { align: 'right' });
  y += 7;

  doc.setDrawColor(160, 174, 192);
  doc.setLineWidth(0.3);
  doc.line(totalsX - 70, y, totalsX, y);
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text('TOTAL (IVA incluido):', totalsX - 65, y);
  doc.text(formatQ(total), totalsX, y, { align: 'right' });
  y += 8;

  // Nota validez
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text('* Cotización válida por 15 días. Precios incluyen IVA.', 14, y);
  y += 6;

  buildFirma(doc, y + 8);

  doc.save(`cotizacion_${String(cotizacion.noCotizacion || '').padStart(4, '0')}.pdf`);
};

export default generarCotizacionPDF;
