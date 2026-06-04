import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logoDefault from '../../assets/logo-default.png';

const COMPANY_DEFAULTS = {
  name: 'Auto Servicios Monterroso',
  occupation: 'Taller de mecánica general, enderezado y pintura',
  address: '10 avenida 7-65, Nueva Montserrat, Zona 3 de Mixco',
  phone: '(502) 5648-6979',
  socialReason: 'Razón social: Mayra Alegría',
};

const formatQ = (n) => `Q${Number(n || 0).toFixed(2)}`;

// Load image from URL and return base64 data URL
const loadImageAsBase64 = (url) =>
  new Promise((resolve) => {
    if (!url) { resolve(null); return; }
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

// ─── Shared header builder ────────────────────────────────────────────────────
export const buildHeader = async (doc, company = {}, logoUrl = null, docType = '', docNumber = '') => {
  const c = { ...COMPANY_DEFAULTS, ...company };
  const pageW = doc.internal.pageSize.width;
  let yPos = 14;
  const logoSize = 22;
  const logoX = 14;

  // Try to load logo (use custom logoUrl if set, otherwise default local asset)
  const logoData = await loadImageAsBase64(logoUrl || logoDefault);
  if (logoData) {
    doc.addImage(logoData, 'PNG', logoX, yPos, logoSize, logoSize);
  }

  const textX = logoData ? logoX + logoSize + 8 : 14;

  // Company name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(30, 30, 30);
  doc.text(c.name, textX, yPos + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(c.occupation, textX, yPos + 12);
  doc.text(c.address, textX, yPos + 17);
  doc.text(`Tel: ${c.phone}   |   ${c.socialReason}`, textX, yPos + 22);

  // Right side — document info
  const rightX = pageW - 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(26, 54, 93);
  doc.text(docType, rightX, yPos + 8, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(docNumber, rightX, yPos + 15, { align: 'right' });

  const fecha = format(new Date(), "dd/MM/yyyy HH:mm", { locale: es });
  doc.text(`Fecha: ${fecha}`, rightX, yPos + 21, { align: 'right' });

  // Divider line
  const lineY = yPos + logoSize + 4;
  doc.setDrawColor(160, 174, 192);
  doc.setLineWidth(0.5);
  doc.line(14, lineY, pageW - 14, lineY);

  return lineY + 6; // return Y position after header
};

// ─── Vehicle info table block ─────────────────────────────────────────────────
export const buildVehicleBlock = (doc, clienteNombre, vehiculoData, startY) => {
  const { marca, linea, complemento, modelo, placa, color, chasis } = vehiculoData || {};

  const vehiculoStr = [marca, linea, complemento].filter(Boolean).join(' ');

  autoTable(doc, {
    startY,
    head: [['Cliente', 'Vehículo', 'Modelo', 'Placa', 'Color', 'Chasis']],
    body: [[
      clienteNombre || '—',
      vehiculoStr || '—',
      modelo || '—',
      placa || '—',
      color || '—',
      chasis || '—',
    ]],
    theme: 'grid',
    headStyles: { fillColor: [26, 54, 93], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    margin: { left: 14, right: 14 },
  });

  return doc.lastAutoTable.finalY + 6;
};

// ─── Repuestos table ──────────────────────────────────────────────────────────
export const buildRepuestosTable = (doc, repuestos, startY) => {
  if (!repuestos || repuestos.length === 0) return startY;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text('Repuestos', 14, startY);

  autoTable(doc, {
    startY: startY + 4,
    head: [['#', 'Descripción', 'Marca', 'Cant.', 'P. Unitario', 'Total']],
    body: repuestos.map((r, i) => [
      i + 1,
      r.nombre,
      r.marca || '—',
      r.cantidad,
      formatQ(r.precioVenta || r.precioUnitario),
      formatQ((r.precioVenta || r.precioUnitario) * r.cantidad),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [26, 54, 93], textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
    margin: { left: 14, right: 14 },
    columnStyles: { 0: { halign: 'center', cellWidth: 12 }, 3: { halign: 'center' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
  });

  return doc.lastAutoTable.finalY + 6;
};

// ─── Firma ────────────────────────────────────────────────────────────────────
export const buildFirma = (doc, startY, label = 'Auto Servicios Monterroso') => {
  const pageW = doc.internal.pageSize.width;
  const centerX = pageW / 2;
  let y = startY + 20;

  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.5);
  doc.line(centerX - 50, y, centerX + 50, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(label, centerX, y, { align: 'center' });

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text('Firma autorizada', centerX, y, { align: 'center' });

  return y + 10;
};

export { formatQ };
