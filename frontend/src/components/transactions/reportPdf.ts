import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';
import { showErrorAlert } from '../../utils/alert';

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
    const tableBody = options.data.map((row) =>
        options.columns.map((c) => {
            const val = row[c.dataKey];
            return val !== null && val !== undefined ? String(val) : '—';
        })
    );

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

