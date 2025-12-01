import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generate PDF from HTML element
 * @param {HTMLElement} element - The DOM element to convert to PDF
 * @param {string} filename - The PDF filename (without .pdf extension)
 * @param {Object} options - Additional options
 */
export const generatePDF = async (element, filename = 'report', options = {}) => {
    try {
        // Default options
        const {
            orientation = 'portrait',
            format = 'a4',
            quality = 2,
            margin = 10
        } = options;

        // Create canvas from HTML element with better quality
        const canvas = await html2canvas(element, {
            scale: quality,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight
        });

        const imgData = canvas.toDataURL('image/png');
        
        // Calculate PDF dimensions
        const pdf = new jsPDF(orientation, 'mm', format);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        
        // Calculate scaling to fit width perfectly with margins
        const availableWidth = pdfWidth - (margin * 2);
        const availableHeight = pdfHeight - (margin * 2);
        
        // Scale to fit width
        let scaledWidth = availableWidth;
        let scaledHeight = (imgHeight * availableWidth) / imgWidth;
        
        // If height exceeds page, scale to fit height instead
        if (scaledHeight > availableHeight) {
            scaledHeight = availableHeight;
            scaledWidth = (imgWidth * availableHeight) / imgHeight;
        }
        
        // Center the image
        const imgX = (pdfWidth - scaledWidth) / 2;
        const imgY = margin;

        // Add image to PDF
        pdf.addImage(imgData, 'PNG', imgX, imgY, scaledWidth, scaledHeight);
        
        // Save PDF
        pdf.save(`${filename}.pdf`);
        
        return { success: true };
    } catch (error) {
        console.error('PDF generation error:', error);
        return { success: false, error };
    }
};

/**
 * Generate PDF from report data with professional table layout
 */
export const generateReportPDF = async (reportData) => {
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Colors
    const primaryColor = [0, 240, 255];
    const darkColor = [26, 31, 46];
    const borderColor = [200, 200, 200];
    
    // Helper function to draw table
    const drawTable = (x, y, width, rows, options = {}) => {
        const rowHeight = options.rowHeight || 8;
        const col1Width = options.col1Width || width * 0.4;
        const col2Width = width - col1Width;
        
        rows.forEach((row, index) => {
            const currentY = y + (index * rowHeight);
            
            // Draw borders
            pdf.setDrawColor(...borderColor);
            pdf.setLineWidth(0.3);
            pdf.rect(x, currentY, col1Width, rowHeight);
            pdf.rect(x + col1Width, currentY, col2Width, rowHeight);
            
            // Fill header row
            if (row.isHeader) {
                pdf.setFillColor(220, 220, 220);
                pdf.rect(x, currentY, width, rowHeight, 'F');
            }
            
            // Draw text
            pdf.setFontSize(9);
            pdf.setTextColor(0, 0, 0);
            pdf.setFont('helvetica', row.isHeader ? 'bold' : (row.boldLabel ? 'bold' : 'normal'));
            pdf.text(row.label, x + 2, currentY + 5.5);
            
            if (row.value) {
                pdf.setFont('helvetica', 'normal');
                const valueText = pdf.splitTextToSize(row.value, col2Width - 4);
                pdf.text(valueText, x + col1Width + 2, currentY + 5.5);
            }
        });
        
        return y + (rows.length * rowHeight);
    };
    
    // Header
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, pageWidth, 25, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MedAI DIAGNOSTIC REPORT', pageWidth / 2, 15, { align: 'center' });
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated: ${new Date().toLocaleDateString('en-MY', { year: 'numeric', month: '2-digit', day: '2-digit' })}`, pageWidth - 15, 15, { align: 'right' });
    
    // Two-column layout
    const leftColX = 15;
    const rightColX = pageWidth / 2 + 10;
    const colWidth = (pageWidth / 2) - 25;
    let leftY = 35;
    let rightY = 35;
    
    // LEFT COLUMN - Patient Information Table
    pdf.setTextColor(...darkColor);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PATIENT INFORMATION', leftColX, leftY);
    leftY += 5;
    
    const patientRows = [
        { label: 'Name:', value: reportData.patientName || 'N/A', boldLabel: true },
        { label: 'RN Number:', value: reportData.registrationNumber || 'N/A', boldLabel: true },
        { label: 'IC/Passport:', value: reportData.icPassport || 'N/A', boldLabel: true },
        { label: 'Age / Gender:', value: `${reportData.age || 'N/A'} / ${reportData.gender || 'N/A'}`, boldLabel: true },
        { label: 'Health Facility:', value: reportData.healthFacility || 'N/A', boldLabel: true },
        { label: 'Collection Date:', value: reportData.collectionDate || 'N/A', boldLabel: true }
    ];
    
    leftY = drawTable(leftColX, leftY, colWidth, patientRows, { rowHeight: 9, col1Width: colWidth * 0.45 });
    leftY += 10;
    
    // Analysis Results Table
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...darkColor);
    pdf.text('MICROSCOPIC ANALYSIS RESULTS', leftColX, leftY);
    leftY += 5;
    
    const analysisRows = [
        { label: 'Parameter', value: 'Result', isHeader: true },
        { label: 'AI Result:', value: reportData.aiResult || 'N/A', boldLabel: true },
        { label: 'Confidence:', value: reportData.confidence || 'N/A', boldLabel: true },
        { label: 'Analyzed At:', value: reportData.analyzedAt || 'N/A', boldLabel: true }
    ];
    
    leftY = drawTable(leftColX, leftY, colWidth, analysisRows, { rowHeight: 9, col1Width: colWidth * 0.4 });
    
    // RIGHT COLUMN - Image
    if (reportData.imageUrl) {
        try {
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(...darkColor);
            pdf.text('MICROSCOPE IMAGE', rightColX, rightY);
            rightY += 5;
            
            // Image with border
            pdf.setDrawColor(...borderColor);
            pdf.setLineWidth(0.5);
            pdf.rect(rightColX, rightY, colWidth, 70);
            
            pdf.addImage(reportData.imageUrl, 'JPEG', rightColX + 1, rightY + 1, colWidth - 2, 68);
            rightY += 75;
        } catch (err) {
            console.warn('Could not add image to PDF:', err);
            rightY += 5;
        }
    }
    
    // Medical Officer Review Table
    if (reportData.moNotes) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...darkColor);
        pdf.text('MEDICAL OFFICER REVIEW', rightColX, rightY);
        rightY += 5;
        
        const moRows = [
            { label: 'Status:', value: reportData.moStatus || 'N/A', boldLabel: true },
            { label: 'Reviewed:', value: reportData.moReviewedAt || 'N/A', boldLabel: true },
            { label: 'Notes:', value: reportData.moNotes, boldLabel: true }
        ];
        
        rightY = drawTable(rightColX, rightY, colWidth, moRows, { rowHeight: 10, col1Width: colWidth * 0.25 });
        rightY += 5;
    }
    
    // Pathologist Review Table
    if (reportData.pathologistNotes) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...darkColor);
        pdf.text('PATHOLOGIST VERIFICATION', rightColX, rightY);
        rightY += 5;
        
        const pathRows = [
            { label: 'Status:', value: reportData.pathologistStatus || 'N/A', boldLabel: true },
            { label: 'Reviewed:', value: reportData.pathologistReviewedAt || 'N/A', boldLabel: true },
            { label: 'Notes:', value: reportData.pathologistNotes, boldLabel: true }
        ];
        
        rightY = drawTable(rightColX, rightY, colWidth, pathRows, { rowHeight: 10, col1Width: colWidth * 0.25 });
    }
    
    // Footer
    pdf.setFillColor(...darkColor);
    pdf.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('MedAI Detection System - Confidential Medical Report', pageWidth / 2, pageHeight - 5, { align: 'center' });
    
    // Save
    const filename = `MedAI_Report_${reportData.registrationNumber || Date.now()}`;
    pdf.save(`${filename}.pdf`);
    
    return { success: true };
};
