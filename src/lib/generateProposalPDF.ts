import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function generateProposalPDF(
  container: HTMLElement,
  clientName: string,
  referenceNumber: string,
): Promise<void> {
  // A4 dimensions in mm
  const pageWidth = 210;
  const pageHeight = 297;

  const pdf = new jsPDF('portrait', 'mm', 'a4');

  const sectionElements = container.querySelectorAll('.pdf-section');

  for (let i = 0; i < sectionElements.length; i++) {
    const section = sectionElements[i] as HTMLElement;

    const canvas = await html2canvas(section, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      width: 794,
      windowWidth: 794,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    if (imgHeight > pageHeight) {
      let heightLeft = imgHeight;
      let position = 0;

      while (heightLeft > 0) {
        if (position > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position === 0 ? 0 : -position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        position += pageHeight;
      }
    } else {
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    }
  }

  const name = clientName || 'Proposal';
  const ref = referenceNumber || '';
  const filename = ref
    ? `${name} - ${ref}.pdf`.replace(/[^a-zA-Z0-9\s\-_.]/g, '')
    : `${name} - Proposal.pdf`.replace(/[^a-zA-Z0-9\s\-_.]/g, '');

  pdf.save(filename);
}
