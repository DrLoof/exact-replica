import { createContext, useContext, useEffect } from 'react';
import { ProposalTemplate, templates } from '@/lib/proposalTemplates';

const TemplateContext = createContext<ProposalTemplate>(templates.classic);

export function TemplateProvider({ templateId, children }: { templateId: string; children: React.ReactNode }) {
  const template = templates[templateId] || templates.classic;

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
