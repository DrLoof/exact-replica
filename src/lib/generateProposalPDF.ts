import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function generateProposalPDF(
  container: HTMLElement,
  clientName: string,
  referenceNumber: string,
): Promise<void> {
  const pageWidth = 210;
  const pageHeight = 297;

  const pdf = new jsPDF('portrait', 'mm', 'a4');

  // Wait for fonts to be ready
  await document.fonts.ready;

  // Wait for all images in the container to load
  const images = container.querySelectorAll('img');
  await Promise.all(
    Array.from(images).map(img =>
      img.complete ? Promise.resolve() : new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      })
    )
  );

  const sectionElements = container.querySelectorAll('.pdf-section');
  let isFirstPage = true;

  for (let i = 0; i < sectionElements.length; i++) {
    const section = sectionElements[i] as HTMLElement;

    // Give extra time for the first (cover) section, less for others
    await new Promise(resolve => setTimeout(resolve, i === 0 ? 400 : 200));

    const canvas = await html2canvas(section, {
      scale: i === 0 ? 3 : 2, // Higher scale for cover to reduce gradient artifacts
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      width: 1024,
      windowWidth: 1024,
      height: section.scrollHeight,
      windowHeight: section.scrollHeight,
    });

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    if (imgHeight <= pageHeight) {
      // Section fits on one page
      if (!isFirstPage) pdf.addPage();
      isFirstPage = false;
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    } else {
      // Section is taller than one page — crop into page-height slices
      let yOffset = 0;
      let remaining = imgHeight;
      let pageIndex = 0;

      while (remaining > 0) {
        // Skip nearly-blank last pages (less than 15% of page height)
        if (remaining < pageHeight * 0.15 && pageIndex > 0) {
          break;
        }

        if (pageIndex > 0 || !isFirstPage) pdf.addPage();
        isFirstPage = false;

        // Calculate source crop coordinates on the canvas
        const sourceY = (yOffset / imgHeight) * canvas.height;
        const sourceHeight = Math.min(
          (pageHeight / imgHeight) * canvas.height,
          canvas.height - sourceY
        );

        // Create a cropped canvas for this page slice
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.ceil(sourceHeight);
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            canvas,
            0, sourceY,
            canvas.width, sourceHeight,
            0, 0,
            canvas.width, sourceHeight
          );
        }

        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
        const pageImgHeight = (sourceHeight * pageWidth) / canvas.width;
        pdf.addImage(pageImgData, 'JPEG', 0, 0, imgWidth, pageImgHeight);

        yOffset += pageHeight;
        remaining -= pageHeight;
        pageIndex++;
      }
    }
  }

  const name = clientName || 'Proposal';
  const ref = referenceNumber || '';
  const filename = ref
    ? `${name} - ${ref}.pdf`.replace(/[^a-zA-Z0-9\s\-_.]/g, '')
    : `${name} - Proposal.pdf`.replace(/[^a-zA-Z0-9\s\-_.]/g, '');

  pdf.save(filename);
}
