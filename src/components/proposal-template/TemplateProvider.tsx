import { createContext, useContext, useEffect } from 'react';
import { ProposalTemplate, templates } from '@/lib/proposalTemplates';

const TemplateContext = createContext<ProposalTemplate>(templates.classic);

export function TemplateProvider({ 
  templateId, 
  customColors,
  children 
}: { 
  templateId: string; 
  customColors?: Record<string, string> | null;
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
    <TemplateContext.Provider value={template}>
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplate() {
  return useContext(TemplateContext);
}
