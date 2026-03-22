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

  // Group sections by their flow-group attribute
  const sectionElements = Array.from(container.querySelectorAll('.pdf-section')) as HTMLElement[];
  
  // Sections that always force a page break before them
  const forceBreakGroups = new Set(['cover', 'summary', 'investment', 'terms', 'signature']);
  
  // Build flow groups: consecutive sections with the same non-forced group merge into one capture
  interface FlowGroup {
    elements: HTMLElement[];
    groupId: string;
    forceBreak: boolean;
  }
  
  const flowGroups: FlowGroup[] = [];
  let currentGroup: FlowGroup | null = null;
  
  for (const section of sectionElements) {
    const groupId = section.getAttribute('data-flow-group') || section.getAttribute('data-section') || 'unknown';
    const shouldForce = forceBreakGroups.has(groupId);
    
    if (shouldForce || !currentGroup || currentGroup.groupId !== groupId) {
      // Start a new flow group
      currentGroup = { elements: [section], groupId, forceBreak: shouldForce };
      flowGroups.push(currentGroup);
    } else {
      // Append to current flow group (natural flow)
      currentGroup.elements.push(section);
    }
  }

  let isFirstPage = true;

  for (let gi = 0; gi < flowGroups.length; gi++) {
    const group = flowGroups[gi];
    
    // For flow groups with multiple elements, create a temporary wrapper to capture them together
    let captureTarget: HTMLElement;
    let tempWrapper: HTMLElement | null = null;
    
    if (group.elements.length === 1) {
      captureTarget = group.elements[0];
    } else {
      // Create a wrapper div that contains all elements in this flow group
      tempWrapper = document.createElement('div');
      tempWrapper.style.width = '1024px';
      tempWrapper.style.background = 'white';
      
      // Clone elements into the wrapper
      for (const el of group.elements) {
        const clone = el.cloneNode(true) as HTMLElement;
        tempWrapper.appendChild(clone);
      }
      
      // Temporarily add to DOM for rendering
      container.appendChild(tempWrapper);
      captureTarget = tempWrapper;
    }

    // Give extra time for the first (cover) section
    const isFirstSection = gi === 0;
    await new Promise(resolve => setTimeout(resolve, isFirstSection ? 400 : 200));

    const canvas = await html2canvas(captureTarget, {
      scale: isFirstSection ? 3 : 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      width: 1024,
      windowWidth: 1024,
      height: captureTarget.scrollHeight,
      windowHeight: captureTarget.scrollHeight,
    });

    // Clean up temp wrapper
    if (tempWrapper) {
      container.removeChild(tempWrapper);
    }

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
        // Skip nearly-blank last pages (less than 12% of page height)
        if (remaining < pageHeight * 0.12 && pageIndex > 0) {
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
