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
    
    // Load MedAI logo
    const logoUrl = '/icon_MedAI.png';
    let logoLoaded = false;
    try {
        // Try to load logo
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = logoUrl;
        await new Promise((resolve) => {
            img.onload = () => {
                logoLoaded = true;
                resolve();
            };
            img.onerror = () => resolve();
            setTimeout(resolve, 1000); // Timeout after 1s
        });
    } catch (err) {
        console.warn('Could not load logo:', err);
    }
    
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
    
    // Header with logo
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, 30, 'F');
    
    // Add logo if loaded
    if (logoLoaded) {
        try {
            pdf.addImage(logoUrl, 'PNG', 15, 5, 20, 20);
        } catch (err) {
            console.warn('Could not add logo to PDF:', err);
        }
    }
    
    // Company name and title
    pdf.setTextColor(...darkColor);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MedAI Labs', 40, 12);
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text('Advanced Diagnostic Center', 40, 18);
    
    // Report title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...darkColor);
    pdf.text('DIAGNOSTIC REPORT', pageWidth - 15, 15, { align: 'right' });
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(new Date().toLocaleDateString('en-MY', { year: 'numeric', month: '2-digit', day: '2-digit' }), pageWidth - 15, 22, { align: 'right' });
    
    // Separator line
    pdf.setDrawColor(...borderColor);
    pdf.setLineWidth(0.5);
    pdf.line(15, 32, pageWidth - 15, 32);
    
    // Two-column layout
    const leftColX = 15;
    const rightColX = pageWidth / 2 + 10;
    const colWidth = (pageWidth / 2) - 25;
    let leftY = 40;
    let rightY = 40;
    
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
        { label: 'Analyzed At:', value: reportData.analyzedAt || 'N/A', boldLabel: true },
        { label: 'Analyzed By:', value: reportData.analyzedBy || 'MedAI System', boldLabel: true }
    ];
    
    leftY = drawTable(leftColX, leftY, colWidth, analysisRows, { rowHeight: 9, col1Width: colWidth * 0.4 });
    
    // RIGHT COLUMN - Images
    const images = reportData.images || (reportData.imageUrl ? [reportData.imageUrl] : []);
    
    if (images.length > 0) {
        try {
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(...darkColor);
            pdf.text(`MICROSCOPE IMAGE${images.length > 1 ? 'S' : ''}`, rightColX, rightY);
            rightY += 5;
            
            // Calculate image dimensions based on count
            const imageCount = Math.min(images.length, 4); // Max 4 images
            const imagesPerRow = imageCount === 1 ? 1 : 2;
            const imageWidth = imageCount === 1 ? colWidth : (colWidth - 5) / 2;
            const imageHeight = imageCount <= 2 ? 60 : 30;
            
            images.slice(0, 4).forEach((imgUrl, index) => {
                try {
                    const row = Math.floor(index / imagesPerRow);
                    const col = index % imagesPerRow;
                    const imgX = rightColX + (col * (imageWidth + 5));
                    const imgY = rightY + (row * (imageHeight + 5));
                    
                    // Image with border
                    pdf.setDrawColor(...borderColor);
                    pdf.setLineWidth(0.5);
                    pdf.rect(imgX, imgY, imageWidth, imageHeight);
                    
                    pdf.addImage(imgUrl, 'JPEG', imgX + 1, imgY + 1, imageWidth - 2, imageHeight - 2);
                } catch (err) {
                    console.warn(`Could not add image ${index + 1} to PDF:`, err);
                }
            });
            
            rightY += (Math.ceil(imageCount / imagesPerRow) * (imageHeight + 5)) + 5;
        } catch (err) {
            console.warn('Could not add images to PDF:', err);
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
    
    // Signature Section
    const signatureY = pageHeight - 45;
    pdf.setDrawColor(...borderColor);
    pdf.setLineWidth(0.3);
    pdf.line(15, signatureY, pageWidth - 15, signatureY);
    
    const sigY = signatureY + 5;
    const sigWidth = (pageWidth - 45) / 3;
    
    // Determine which signatures to show based on current user role
    const currentRole = reportData.currentUserRole?.toUpperCase();
    const isHigherRole = ['MO', 'MEDICAL_OFFICER', 'PATH', 'PATHOLOGIST', 'HO', 'HEALTH_OFFICER', 'ADMIN'].includes(currentRole);
    
    if (isHigherRole) {
        // For MO, PATH, HO, ADMIN - Only show their own signature
        let roleTitle = 'Medical Officer';
        if (currentRole === 'PATH' || currentRole === 'PATHOLOGIST') {
            roleTitle = 'Pathologist';
        } else if (currentRole === 'HO' || currentRole === 'HEALTH_OFFICER') {
            roleTitle = 'Health Officer';
        } else if (currentRole === 'ADMIN') {
            roleTitle = 'Administrator';
        }
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...darkColor);
        pdf.text(roleTitle, 15, sigY);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Name: ${reportData.currentUserName || '_____________________'}`, 15, sigY + 10);
        pdf.text('Signature: _________________', 15, sigY + 17);
        pdf.text(`Date: ${reportData.labTechDate || '_____________________'}`, 15, sigY + 24);
    } else {
        // For Lab Technician - Show all three signatures
        // Lab Technician Signature (Auto-filled)
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...darkColor);
        pdf.text('Lab Technician', 15, sigY);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Name: ${reportData.labTechName || '_____________________'}`, 15, sigY + 10);
        pdf.text('Signature: _________________', 15, sigY + 17);
        pdf.text(`Date: ${reportData.labTechDate || '_____________________'}`, 15, sigY + 24);
        
        // Medical Officer Signature (Filled when approved)
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...darkColor);
        pdf.text('Medical Officer', 15 + sigWidth + 15, sigY);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Name: ${reportData.moName || '_____________________'}`, 15 + sigWidth + 15, sigY + 10);
        pdf.text('Signature: _________________', 15 + sigWidth + 15, sigY + 17);
        pdf.text(`Date: ${reportData.moDate || '_____________________'}`, 15 + sigWidth + 15, sigY + 24);
        
        // Pathologist Signature (Filled when verified)
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...darkColor);
        pdf.text('Pathologist', 15 + (sigWidth + 15) * 2, sigY);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Name: ${reportData.pathologistName || '_____________________'}`, 15 + (sigWidth + 15) * 2, sigY + 10);
        pdf.text('Signature: _________________', 15 + (sigWidth + 15) * 2, sigY + 17);
        pdf.text(`Date: ${reportData.pathologistDate || '_____________________'}`, 15 + (sigWidth + 15) * 2, sigY + 24);
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
