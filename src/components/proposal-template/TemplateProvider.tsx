import { createContext, useContext, useEffect } from 'react';
import { ProposalTemplate, templates } from '@/lib/proposalTemplates';

const TemplateContext = createContext<ProposalTemplate>(templates.classic);
const PDFModeContext = createContext<boolean>(false);

export function TemplateProvider({ 
  templateId, 
  customColors,
  isPDFMode = false,
  children 
}: { 
  templateId: string; 
  customColors?: Record<string, string> | null;
  isPDFMode?: boolean;
  children: React.ReactNode;
}) {
  const baseTemplate = templates[templateId] || templates.classic;
  
  const template = customColors ? {
    ...baseTemplate,
    colors: {
      ...baseTemplate.colors,
      ...customColors,
    },
  } : baseTemplate;

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = template.fonts.googleFontsUrl;
    link.id = `template-font-${template.id}`;
    if (!document.getElementById(link.id)) {
      document.head.appendChild(link);
    }
  }, [template]);

  return (
    <PDFModeContext.Provider value={isPDFMode}>
      <TemplateContext.Provider value={template}>
        {children}
      </TemplateContext.Provider>
    </PDFModeContext.Provider>
  );
}

export function useTemplate() {
  return useContext(TemplateContext);
}

export function usePDFMode() {
  return useContext(PDFModeContext);
}
