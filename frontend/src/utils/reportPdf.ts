import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';
import { showErrorAlert } from './alert';

export interface ReportColumnDef {
  header: string;
  dataKey: string;
  align?: 'left' | 'center' | 'right';
  width?: number;
}

export interface ReportPdfOptions {
  title: string;
  subtitle?: string;
  filename: string;
  filters?: { label: string; value: string }[];
  columns: ReportColumnDef[];
  data: Record<string, any>[];
  totals?: Record<string, any>;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Builds and returns a formatted jsPDF document with Rudra Silver branding,
 * headers, meta filters, data table, totals, and pagination footers.
 */
export function buildReportPdf(options: ReportPdfOptions): jsPDF {
  const orientation = options.orientation || 'landscape';
  const doc = new jsPDF({
    orientation,
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 30;
  const marginRight = 30;

  // 1. Company Branding & Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Gold accent line
  doc.setFillColor(217, 119, 6); // amber-600
  doc.rect(0, 42, pageWidth, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('RUDRA SILVER JEWELLERY ERP', marginLeft, 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('Official Accounting & Stock Register Report', pageWidth - marginRight, 26, { align: 'right' });

  // 2. Report Title & Generation Metadata
  let currentY = 62;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(options.title.toUpperCase(), marginLeft, currentY);

  const genDateStr = `Generated on: ${new Date().toLocaleString('en-IN')}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(genDateStr, pageWidth - marginRight, currentY, { align: 'right' });

  currentY += 12;

  // 3. Filter summary line (if provided)
  if (options.filters && options.filters.length > 0) {
    const filterText = options.filters
      .filter((f) => f.value && f.value !== 'all' && f.value !== 'ALL')
      .map((f) => `${f.label}: ${f.value}`)
      .join('   |   ');

    if (filterText) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Active Filters:  ${filterText}`, marginLeft, currentY);
      currentY += 12;
    }
  }

  // 4. Build columnStyles
  const columnStyles: Record<number, any> = {};
  options.columns.forEach((col, idx) => {
    columnStyles[idx] = {
      halign: col.align || 'left',
    };
    if (col.width) {
      columnStyles[idx].cellWidth = col.width;
    }
  });

  // 5. Construct Table Body & Foot
  const tableHead = [options.columns.map((c) => c.header)];
  const tableBody =
    options.data.length > 0
      ? options.data.map((row) =>
          options.columns.map((c) => {
            const val = row[c.dataKey];
            return val !== null && val !== undefined ? String(val) : '—';
          })
        )
      : [
          [
            {
              content: 'No matching records found for the selected filters.',
              colSpan: options.columns.length,
              styles: { halign: 'center', fontStyle: 'italic', textColor: [100, 116, 139], cellPadding: 14 },
            } as any,
          ],
        ];

  const tableFoot = options.totals
    ? [options.columns.map((c) => (options.totals![c.dataKey] !== undefined ? String(options.totals![c.dataKey]) : ''))]
    : undefined;

  // 6. Draw AutoTable with repeated headers across multiple pages
  autoTable(doc, {
    head: tableHead,
    body: tableBody,
    foot: tableFoot,
    startY: currentY,
    margin: { left: marginLeft, right: marginRight, top: 55, bottom: 35 },
    showHead: 'everyPage',
    showFoot: 'lastPage',
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: { top: 3.5, right: 3.5, bottom: 3.5, left: 3.5 },
      overflow: 'linebreak',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    footStyles: {
      fillColor: [254, 243, 199], // amber-100
      textColor: [120, 53, 15],  // amber-900
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles,
    didDrawPage: (data) => {
      // Running header on page 2+
      if (data.pageNumber > 1) {
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageWidth, 28, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`RUDRA SILVER ERP – ${options.title.toUpperCase()}`, marginLeft, 18);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(203, 213, 225);
        doc.text(genDateStr, pageWidth - marginRight, 18, { align: 'right' });
      }

      // Running footer on every page
      const totalPages = (doc as any).internal.getNumberOfPages();
      const pageStr = `Page ${data.pageNumber} of ${totalPages}`;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Rudra Silver Jewellery ERP • Confidential & Proprietary Report',
        marginLeft,
        pageHeight - 16
      );
      doc.text(pageStr, pageWidth - marginRight, pageHeight - 16, { align: 'right' });
    },
  });

  return doc;
}

/**
 * Printable HTML report generator for instant, pixel-perfect browser printing
 * across multiple pages with repeated table headers and exact print CSS.
 */
export async function printReport(options: ReportPdfOptions): Promise<void> {
  try {
    const doc = buildReportPdf(options);
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    const printWindow = window.open(blobUrl, '_blank');
    if (!printWindow) {
      // Fallback: save PDF directly if popup blocked
      doc.save(options.filename);
      Swal.fire({
        icon: 'info',
        title: 'Print Window Blocked',
        text: 'The print preview popup was blocked by your browser. The report PDF has been downloaded directly so you can print it.',
        confirmButtonColor: '#d97706',
      });
    }
  } catch (err: any) {
    console.error('Print generation failed:', err);
    showErrorAlert(err.message || 'Failed to generate printable report.');
  }
}

/**
 * Downloads the formatted PDF file directly to the user's computer.
 */
export async function downloadReportPdf(options: ReportPdfOptions): Promise<void> {
  try {
    const doc = buildReportPdf(options);
    doc.save(options.filename);
    Swal.fire({
      icon: 'success',
      title: 'PDF Downloaded',
      text: `${options.filename} has been downloaded successfully.`,
      timer: 3000,
      showConfirmButton: false,
    });
  } catch (err: any) {
    console.error('PDF Download failed:', err);
    showErrorAlert(err.message || 'Failed to generate and download PDF report.');
  }
}

/**
 * Shares the PDF report through WhatsApp:
 * 1. Generates PDF blob & File object.
 * 2. If navigator.canShare({ files: [file] }) is supported, shares directly with contacts/groups.
 * 3. Fallback: downloads the PDF directly, opens WhatsApp Web with prefilled message,
 *    and displays a guide dialog to attach the downloaded file.
 */
export async function shareReportOnWhatsApp(
  options: ReportPdfOptions & { recipientPhone?: string }
): Promise<void> {
  try {
    const doc = buildReportPdf(options);
    const blob = doc.output('blob');
    const file = new File([blob], options.filename, { type: 'application/pdf' });

    const messageText = `Hello, please find the attached ${options.title} report from RUDRA SILVER ERP.\n\nDate: ${new Date().toLocaleDateString('en-IN')}\nTotal Records: ${options.data.length}\n\n(Generated via Rudra Silver ERP)`;

    // Check if Web Share API with file attachments is supported (e.g. mobile or supported desktop browsers)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: options.title,
          text: messageText,
        });
        return;
      } catch (shareErr: any) {
        if (shareErr.name === 'AbortError') {
          // User cancelled the share dialog
          return;
        }
        console.warn('Native Web Share failed, falling back to WhatsApp Web link:', shareErr);
      }
    }

    // Fallback Workflow for Standard Browsers:
    // 1. Download the PDF file directly so the user has it ready
    doc.save(options.filename);

    // 2. Open WhatsApp Web / WhatsApp App with prefilled message
    const cleanPhone = options.recipientPhone ? options.recipientPhone.replace(/[^0-9]/g, '') : '';
    const encodedMsg = encodeURIComponent(
      `Hello, please find the attached ${options.title} report from RUDRA SILVER ERP.\n\nDate: ${new Date().toLocaleDateString('en-IN')}\nTotal Records: ${options.data.length}\n\n(The PDF file "${options.filename}" has been downloaded to your device for attaching).`
    );

    const waUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`
      : `https://api.whatsapp.com/send?text=${encodedMsg}`;

    window.open(waUrl, '_blank');

    // 3. User feedback
    Swal.fire({
      icon: 'info',
      title: 'WhatsApp PDF Sharing',
      html: `
        <div style="text-align: left; font-size: 13px; line-height: 1.6;">
          <p style="margin-bottom: 8px;"><strong>1. Report Downloaded:</strong> <span style="color: #d97706;">${options.filename}</span> has been downloaded to your computer.</p>
          <p style="margin-bottom: 8px;"><strong>2. WhatsApp Web Opened:</strong> WhatsApp has been launched in a new tab with your prefilled report message.</p>
          <p style="margin-bottom: 0;"><strong>3. Action:</strong> Simply select your contact or group and attach the downloaded PDF file.</p>
        </div>
      `,
      confirmButtonText: 'Understood',
      confirmButtonColor: '#d97706',
    });
  } catch (err: any) {
    console.error('WhatsApp Share failed:', err);
    showErrorAlert(err.message || 'Failed to prepare report for WhatsApp sharing.');
  }
}

export interface VoucherPdfData {
  voucher_no: string | number;
  series?: string;
  voucher_type: string;
  voucher_date: string;
  account_name?: string;
  second_account_name?: string | null;
  payment_mode?: string;
  net_amount: number;
  narration?: string | null;
  entries?: Array<{
    ledger_code?: string;
    ledger_name?: string;
    debit_amount: number;
    credit_amount: number;
    narration?: string;
  }>;
  allocations?: Array<{
    invoice_source: string;
    invoice_id: number;
    allocated_amount: number;
  }>;
}

export function buildVoucherPdf(v: VoucherPdfData): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 32;

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 48, 'F');
  doc.setFillColor(217, 119, 6);
  doc.rect(0, 48, pageWidth, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('RUDRA SILVER JEWELLERY ERP', margin, 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`${v.voucher_type} VOUCHER`, pageWidth - margin, 26, { align: 'right' });

  let y = 72;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Voucher No: ${v.series ? v.series + '/' : ''}${v.voucher_no}`, margin, y);
  doc.text(`Date: ${v.voucher_date}`, pageWidth - margin, y, { align: 'right' });

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Party / Account: ${v.account_name || '—'}`, margin, y);
  if (v.payment_mode) {
    doc.text(`Payment Mode: ${v.payment_mode}`, pageWidth - margin, y, { align: 'right' });
  }
  if (v.second_account_name) {
    y += 15;
    doc.text(`Counter Account: ${v.second_account_name}`, margin, y);
  }

  y += 18;
  const entries = v.entries && v.entries.length > 0 ? v.entries : [];
  const totalDr = entries.reduce((s, e) => s + Number(e.debit_amount || 0), 0) || Number(v.net_amount || 0);
  const totalCr = entries.reduce((s, e) => s + Number(e.credit_amount || 0), 0) || Number(v.net_amount || 0);
  const diff = Math.abs(totalDr - totalCr);

  autoTable(doc, {
    head: [['Code', 'Ledger Name', 'Narration', 'Debit (INR)', 'Credit (INR)']],
    body: entries.length > 0
      ? entries.map((e) => [
          e.ledger_code || '—',
          e.ledger_name || '—',
          e.narration || v.narration || '—',
          Number(e.debit_amount) > 0 ? Number(e.debit_amount).toFixed(2) : '—',
          Number(e.credit_amount) > 0 ? Number(e.credit_amount).toFixed(2) : '—',
        ])
      : [[
          '—',
          v.account_name || 'Account',
          v.narration || v.voucher_type,
          Number(v.net_amount || 0).toFixed(2),
          Number(v.net_amount || 0).toFixed(2),
        ]],
    foot: [[
      'TOTAL',
      `Difference: ${diff.toFixed(2)}`,
      '',
      totalDr.toFixed(2),
      totalCr.toFixed(2),
    ]],
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8.5 },
    footStyles: { fillColor: [254, 243, 199], textColor: [120, 53, 15], fontStyle: 'bold', fontSize: 8.5 },
    styles: { fontSize: 8.5, cellPadding: 5 },
    columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } },
  });

  y = ((doc as any).lastAutoTable?.finalY || y + 80) + 18;

  if (v.allocations && v.allocations.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('Invoice Allocations:', margin, y);
    y += 8;
    autoTable(doc, {
      head: [['Invoice Source', 'Invoice ID', 'Allocated Amount (INR)']],
      body: v.allocations.map((a) => [a.invoice_source, `#${a.invoice_id}`, Number(a.allocated_amount).toFixed(2)]),
      startY: y,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 4 },
      columnStyles: { 2: { halign: 'right' } },
    });
    y = ((doc as any).lastAutoTable?.finalY || y + 40) + 18;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Narration: ${v.narration || '—'}`, margin, y);

  y += 50;
  doc.setDrawColor(148, 163, 184);
  doc.line(margin, y, margin + 130, y);
  doc.line(pageWidth - margin - 130, y, pageWidth - margin, y);
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Prepared / Checked By', margin, y + 12);
  doc.text('Authorized Signature', pageWidth - margin, y + 12, { align: 'right' });

  return doc;
}

export function printVoucherPdf(v: VoucherPdfData): void {
  const doc = buildVoucherPdf(v);
  doc.autoPrint();
  const url = doc.output('bloburl');
  const win = window.open(url, '_blank');
  if (!win) doc.save(`Voucher_${v.voucher_type}_${v.voucher_no}.pdf`);
}

export function downloadVoucherPdf(v: VoucherPdfData): void {
  const doc = buildVoucherPdf(v);
  doc.save(`Voucher_${v.voucher_type}_${v.voucher_no}.pdf`);
}

export function buildInvoicePdf(inv: any): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 28;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 48, 'F');
  doc.setFillColor(217, 119, 6);
  doc.rect(0, 48, pageWidth, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('RUDRA SILVER JEWELLERY ERP', margin, 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`${inv.voucher_type || 'TAX'} INVOICE`, pageWidth - margin, 26, { align: 'right' });

  let y = 70;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(`Invoice No: ${inv.series ? inv.series + '/' : ''}${inv.voucher_no || inv.id}`, margin, y);
  doc.text(`Date: ${inv.voucher_date || ''}`, pageWidth - margin, y, { align: 'right' });

  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Customer / Party: ${inv.account_name || 'Walk-in Customer'}`, margin, y);
  doc.text(`Mobile: ${inv.account_mobile || '—'}`, pageWidth - margin, y, { align: 'right' });

  y += 16;
  const items = Array.isArray(inv.items) ? inv.items : [];
  autoTable(doc, {
    head: [['#', 'Description', 'Pcs', 'Gross(g)', 'Less(g)', 'Net(g)', 'Touch', 'Fine(g)', 'Rate', 'Labour', 'Stone', 'Total']],
    body: items.length > 0
      ? items.map((it: any, idx: number) => [
          idx + 1,
          it.item_description || it.description || 'Silver Item',
          it.pieces ?? 1,
          Number(it.gross_weight || 0).toFixed(3),
          Number(it.less_weight || 0).toFixed(3),
          Number(it.net_weight || 0).toFixed(3),
          Number(it.purity_touch || 0).toFixed(2),
          Number(it.fine_weight || 0).toFixed(3),
          Number(it.metal_rate_per_gram || 0).toFixed(2),
          Number(it.labour_amount || 0).toFixed(2),
          Number(it.stone_amount || 0).toFixed(2),
          Number(it.total_item_amount || 0).toFixed(2),
        ])
      : [['1', inv.narration || 'Jewellery Sale', '1', '—', '—', '—', '—', '—', '—', '—', '—', Number(inv.net_amount || 0).toFixed(2)]],
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 7.5 },
    styles: { fontSize: 7.5, cellPadding: 3.5 },
    columnStyles: {
      2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' },
      6: { halign: 'right' }, 7: { halign: 'right' }, 8: { halign: 'right' }, 9: { halign: 'right' },
      10: { halign: 'right' }, 11: { halign: 'right' },
    },
  });

  y = ((doc as any).lastAutoTable?.finalY || y + 60) + 16;
  const gst = Number(inv.cgst_amount || 0) + Number(inv.sgst_amount || 0) + Number(inv.igst_amount || 0);
  const net = Number(inv.net_amount || 0);
  const paid = Number(inv.paid_amount || 0);
  const out = Number(inv.outstanding_amount ?? Math.max(0, net - paid));
  const status = inv.payment_status || (out <= 0 && net > 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID');

  const summaryX = pageWidth - margin - 200;
  doc.setFontSize(9);
  doc.text(`Gross Amount:`, summaryX, y); doc.text(`INR ${Number(inv.gross_amount || net).toFixed(2)}`, pageWidth - margin, y, { align: 'right' }); y += 14;
  doc.text(`Discount:`, summaryX, y); doc.text(`INR ${Number(inv.discount_amount || 0).toFixed(2)}`, pageWidth - margin, y, { align: 'right' }); y += 14;
  doc.text(`GST Total:`, summaryX, y); doc.text(`INR ${gst.toFixed(2)}`, pageWidth - margin, y, { align: 'right' }); y += 14;
  doc.setFont('helvetica', 'bold');
  doc.text(`Grand Total:`, summaryX, y); doc.text(`INR ${net.toFixed(2)}`, pageWidth - margin, y, { align: 'right' }); y += 14;
  doc.setFont('helvetica', 'normal');
  doc.text(`Paid Amount:`, summaryX, y); doc.text(`INR ${paid.toFixed(2)}`, pageWidth - margin, y, { align: 'right' }); y += 14;
  doc.text(`Outstanding (${status}):`, summaryX, y); doc.text(`INR ${out.toFixed(2)}`, pageWidth - margin, y, { align: 'right' });

  y += 45;
  doc.setDrawColor(148, 163, 184);
  doc.line(pageWidth - margin - 140, y, pageWidth - margin, y);
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Authorized Signatory', pageWidth - margin, y + 12, { align: 'right' });

  return doc;
}

export function printInvoicePdf(inv: any): void {
  const doc = buildInvoicePdf(inv);
  doc.autoPrint();
  const url = doc.output('bloburl');
  const win = window.open(url, '_blank');
  if (!win) doc.save(`Invoice_${inv.voucher_no || inv.id}.pdf`);
}

export function downloadInvoicePdf(inv: any): void {
  const doc = buildInvoicePdf(inv);
  doc.save(`Invoice_${inv.voucher_no || inv.id}.pdf`);
}
