import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { buildHeader, buildVehicleBlock, buildManoDeObraTable, buildRepuestosTable, buildFirmaCliente, formatQ } from './pdfBase';
import { DEFAULT_TERMINOS } from '../../data/terminosOrden';

const FUEL_LABELS = { vacio: 'Vacío', cuarto: '1/4', medio: '1/2', tres_cuartos: '3/4', lleno: 'Lleno' };

const generarOrdenPDF = async (orden, company = {}, logoUrl = null, terminosCustom = null) => {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.width;

  // Header
  let y = await buildHeader(doc, company, logoUrl, 'ORDEN DE TRABAJO', `No. ${String(orden.noOrden || '').padStart(4, '0')}`);

  // Cliente + Vehículo (incluye NIT y dirección)
  const clienteExtra = {
    nit: orden.clienteNit || '',
    direccion: orden.clienteDireccion || '',
  };
  y = buildVehicleBlock(doc, orden.clienteNombre, orden.vehiculoData, y, clienteExtra);

  // Datos de ingreso
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text('Datos de Ingreso', 14, y);

  autoTable(doc, {
    startY: y + 4,
    head: [['Kilometraje', 'Nivel de Combustible', 'Estado']],
    body: [[
      orden.kilometraje ? `${orden.kilometraje} km` : '—',
      FUEL_LABELS[orden.nivelCombustible] || orden.nivelCombustible || '—',
      orden.estado || 'Pendiente',
    ]],
    theme: 'grid',
    headStyles: { fillColor: [26, 54, 93], textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
    margin: { left: 14, right: 14 },
  });
  y = doc.lastAutoTable.finalY + 8;

  // Falla reportada
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text('Falla Reportada:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  const fallaLines = doc.splitTextToSize(orden.fallaReportada || '—', pageW - 28);
  doc.text(fallaLines, 14, y + 6);
  y += 6 + fallaLines.length * 5 + 6;

  // Mano de obra detallada
  y = buildManoDeObraTable(doc, orden.manoDeObraItems, orden.manoDeObra, y);

  // Repuestos
  y = buildRepuestosTable(doc, orden.repuestos, y);

  // Totales
  const subtotalRepuestos = (orden.repuestos || []).reduce(
    (s, r) => s + (r.precioVenta || r.precioUnitario || 0) * r.cantidad, 0
  );
  const totalMDO = (orden.manoDeObraItems || []).reduce((s, it) => s + Number(it.monto || 0), 0)
    || Number(orden.manoDeObra || 0);
  const total = Number(orden.total || subtotalRepuestos + totalMDO);
  const anticipo = Number(orden.anticipo || 0);
  const saldo = total - anticipo;

  const totalsX = pageW - 14;
  doc.setDrawColor(160, 174, 192);
  doc.setLineWidth(0.3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('Subtotal repuestos:', totalsX - 65, y);
  doc.text(formatQ(subtotalRepuestos), totalsX, y, { align: 'right' });
  y += 7;

  doc.text('Mano de obra:', totalsX - 65, y);
  doc.text(formatQ(totalMDO), totalsX, y, { align: 'right' });
  y += 7;

  doc.line(totalsX - 70, y, totalsX, y);
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text('TOTAL:', totalsX - 65, y);
  doc.text(formatQ(total), totalsX, y, { align: 'right' });
  y += 8;

  if (anticipo > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(34, 197, 94);
    doc.text('Anticipo recibido:', totalsX - 65, y);
    doc.text(`- ${formatQ(anticipo)}`, totalsX, y, { align: 'right' });
    y += 7;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(217, 119, 6);
    doc.text('SALDO:', totalsX - 65, y);
    doc.text(formatQ(saldo), totalsX, y, { align: 'right' });
    y += 8;
  }

  // Firma del CLIENTE + términos
  const terminos = terminosCustom !== null ? terminosCustom : DEFAULT_TERMINOS;
  buildFirmaCliente(doc, y + 6, orden.clienteNombre, terminos);

  doc.save(`orden_${String(orden.noOrden || '').padStart(4, '0')}_${orden.vehiculoData?.placa || 'sin-placa'}.pdf`);
};

export default generarOrdenPDF;
