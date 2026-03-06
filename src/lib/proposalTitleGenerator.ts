// Category → Title label mapping
const categoryLabels: Record<string, string> = {
  'Brand & Creative': 'Brand',
  'Website & Digital': 'Web',
  'Content & Copywriting': 'Content',
  'SEO & Organic Growth': 'SEO',
  'Social Media': 'Social Media',
  'Paid Advertising': 'Paid Media',
  'Email Marketing': 'Email Marketing',
  'Marketing Automation & CRM': 'Marketing Automation',
  'Analytics & Reporting': 'Analytics',
  'Strategy & Consulting': 'Marketing Strategy',
  'Conversion Rate Optimization': 'CRO',
  'PR & Communications': 'PR',
};

// Priority order for combining (higher index = lower priority)
const priorityOrder = [
  'Strategy & Consulting',
  'Brand & Creative',
  'Website & Digital',
  'Content & Copywriting',
  'SEO & Organic Growth',
  'Social Media',
  'Paid Advertising',
  'Email Marketing',
  'Marketing Automation & CRM',
  'Analytics & Reporting',
  'Conversion Rate Optimization',
  'PR & Communications',
];

export function generateProposalTitle(
  selectedModules: Array<{ name: string; groupName?: string }>,
  clientName: string,
  groups: Array<{ id: string; name: string }>,
  moduleGroupMap: Record<string, string> // moduleId -> groupId
): string {
  if (!clientName || selectedModules.length === 0) {
    return `Proposal for ${clientName || 'Client'}`;
  }

  // Count modules per category
  const categoryCounts: Record<string, number> = {};
  selectedModules.forEach(mod => {
    const groupName = mod.groupName || '';
    if (groupName) {
      categoryCounts[groupName] = (categoryCounts[groupName] || 0) + 1;
    }
  });

  const uniqueCategories = Object.keys(categoryCounts);

  if (uniqueCategories.length === 0) {
    return `Proposal for ${clientName}`;
  }

  if (uniqueCategories.length === 1) {
    const label = categoryLabels[uniqueCategories[0]] || uniqueCategories[0];
    return `${label} Proposal for ${clientName}`;
  }

  if (uniqueCategories.length === 2) {
    // Sort by priority (lower index = higher priority = goes first)
    const sorted = [...uniqueCategories].sort((a, b) => {
      const aIdx = priorityOrder.indexOf(a);
      const bIdx = priorityOrder.indexOf(b);
      return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
    });
    const labelA = categoryLabels[sorted[0]] || sorted[0];
    const labelB = categoryLabels[sorted[1]] || sorted[1];
    return `${labelA} & ${labelB} Proposal for ${clientName}`;
  }

  // 3+ categories — use broader label
  if (uniqueCategories.includes('Strategy & Consulting')) {
    return `Marketing Strategy & Services Proposal for ${clientName}`;
  }
  if (uniqueCategories.includes('Brand & Creative')) {
    return `Brand & Marketing Proposal for ${clientName}`;
  }
  if (uniqueCategories.length >= 5) {
    return `Marketing Services Proposal for ${clientName}`;
  }
  return `Digital Marketing Proposal for ${clientName}`;
}
