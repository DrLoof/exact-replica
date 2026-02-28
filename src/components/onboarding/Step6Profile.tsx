import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Target, BarChart3, Users, Trophy, Zap, Layers, ChevronDown, ChevronRight } from 'lucide-react';

const defaultDifferentiators = [
  { icon: 'Target', title: 'Strategy-Led Approach', statValue: '87%', statLabel: 'Success rate', description: 'Every project starts with strategy, not tactics.' },
  { icon: 'BarChart3', title: 'Transparent Reporting', statValue: 'Weekly', statLabel: 'Updates', description: 'Clear dashboards and weekly progress reports.' },
  { icon: 'Users', title: 'Dedicated Team', statValue: '1', statLabel: 'Point of Contact', description: 'A single dedicated account manager for your project.' },
  { icon: 'Trophy', title: 'Proven Results', statValue: '150+', statLabel: 'Projects', description: 'Track record of delivering measurable outcomes.' },
  { icon: 'Zap', title: 'Agile Process', statValue: '2-week', statLabel: 'Sprint Cycles', description: 'Iterative approach with regular check-ins and pivots.' },
  { icon: 'Layers', title: 'Full-Service Capability', statValue: 'End-to-end', statLabel: 'Delivery', description: 'From strategy through execution and optimization.' },
];

const defaultTerms = [
  { title: 'Payment Terms', content: 'Payment is due according to the milestone schedule outlined in this proposal. Late payments may incur a 1.5% monthly charge.' },
  { title: 'Project Timeline & Milestones', content: 'The project timeline begins upon receipt of the initial payment and signed proposal. Milestones are outlined in the timeline section.' },
  { title: 'Revision Policy', content: 'This proposal includes the specified number of revision rounds per deliverable. Additional revisions will be billed at the hourly rate.' },
  { title: 'Intellectual Property', content: 'Upon full payment, all deliverables and intellectual property rights transfer to the client. Work-in-progress remains property of the agency until final payment.' },
  { title: 'Confidentiality', content: 'Both parties agree to keep all project information, strategies, and data confidential. This obligation survives the termination of this agreement.' },
  { title: 'Termination', content: 'Either party may terminate this agreement with written notice as specified. Work completed up to termination date will be billed accordingly.' },
  { title: 'Liability', content: 'Agency liability is limited to the total fees paid under this agreement. Neither party shall be liable for indirect or consequential damages.' },
  { title: 'Governing Law', content: 'This agreement shall be governed by and construed in accordance with the laws of the jurisdiction where the agency is registered.' },
];

type Tab = 'whyus' | 'testimonials' | 'terms';

export function Step6Profile() {
  const [tab, setTab] = useState<Tab>('whyus');
  const [expandedTerms, setExpandedTerms] = useState<Record<number, boolean>>({});

  const toggleTerm = (i: number) => setExpandedTerms((p) => ({ ...p, [i]: !p[i] }));

  const icons: Record<string, any> = { Target, BarChart3, Users, Trophy, Zap, Layers };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">Make your proposals stand out</h1>
      <p className="mt-2 text-sm text-muted-foreground">Add your story, social proof, and terms.</p>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-border">
        {([['whyus', 'Why Us'], ['testimonials', 'Testimonials'], ['terms', 'Terms & Conditions']] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === key ? 'border-brand text-brand' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'whyus' && (
          <div>
            <textarea
              placeholder="We're a team of passionate marketers, designers, and developers who believe in..."
              rows={3}
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none"
            />
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
              {defaultDifferentiators.map((d, i) => {
                const Icon = icons[d.icon] || Target;
                return (
                  <div key={i} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-brand" />
                      <span className="text-xs font-semibold text-foreground">{d.title}</span>
                    </div>
                    <div className="mt-2">
                      <span className="font-display text-lg font-bold text-foreground">{d.statValue}</span>
                      <span className="ml-1 text-xs text-muted-foreground">{d.statLabel}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{d.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'testimonials' && (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-foreground">No testimonials yet</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              Don't have testimonials ready? No problem — you can add them later in Settings.
            </p>
          </div>
        )}

        {tab === 'terms' && (
          <div>
            <p className="mb-4 text-xs text-muted-foreground">
              These are templates — we recommend legal review for your jurisdiction.
            </p>
            <div className="space-y-1.5">
              {defaultTerms.map((term, i) => (
                <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
                  <button
                    onClick={() => toggleTerm(i)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <span className="text-sm font-medium text-foreground">{term.title}</span>
                    {expandedTerms[i] ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {expandedTerms[i] && (
                    <div className="border-t border-border px-4 py-3">
                      <textarea
                        defaultValue={term.content}
                        rows={3}
                        className="w-full text-sm text-foreground bg-transparent resize-none focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
