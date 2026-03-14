import { useState } from 'react';
import { Search, Globe, Loader2, X, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const challengeOptions = [
  'Not enough website traffic',
  'Website isn\'t converting visitors',
  'Low brand awareness',
  'Inconsistent or outdated branding',
  'No clear marketing strategy',
  'Social media isn\'t driving results',
  'Not generating enough leads',
  'Ad spend isn\'t delivering results',
  'Email marketing underperforming',
  'Can\'t measure what\'s working',
];

export interface GoalOption {
  id: string;
  label: string;
  defaultKpi: string;
  relatedServices: string[];
}

export const goalOptionsList: GoalOption[] = [
  { id: "website_traffic", label: "Increase website traffic", defaultKpi: "+200%", relatedServices: ["SEO", "Content Marketing", "PPC / Digital Advertising", "SEO & Organic Growth", "Content & Copywriting", "Paid Advertising"] },
  { id: "lead_generation", label: "Generate more leads", defaultKpi: "3x", relatedServices: ["PPC / Digital Advertising", "Marketing Automation", "Email Marketing", "SEO", "Paid Advertising", "Marketing Automation & CRM", "Email Marketing", "SEO & Organic Growth"] },
  { id: "brand_awareness", label: "Improve brand awareness", defaultKpi: "+40%", relatedServices: ["Brand Identity", "Social Media Management", "Content Marketing", "Brand & Creative", "Social Media", "Content & Copywriting"] },
  { id: "conversion_rate", label: "Boost conversion rate", defaultKpi: "2x", relatedServices: ["Website Design", "PPC / Digital Advertising", "Email Marketing", "Website & Digital", "Paid Advertising", "Conversion Rate Optimization"] },
  { id: "cost_per_acquisition", label: "Reduce cost per acquisition", defaultKpi: "-40%", relatedServices: ["PPC / Digital Advertising", "Marketing Automation", "Paid Advertising", "Marketing Automation & CRM", "Analytics & Reporting"] },
  { id: "social_growth", label: "Grow social media presence", defaultKpi: "+80%", relatedServices: ["Social Media Management", "Content Marketing", "Social Media", "Content & Copywriting"] },
  { id: "email_engagement", label: "Increase email engagement", defaultKpi: "+60%", relatedServices: ["Email Marketing", "Marketing Automation", "Marketing Automation & CRM"] },
  { id: "client_retention", label: "Improve client retention", defaultKpi: "95%", relatedServices: ["Email Marketing", "Marketing Automation", "Analytics & Reporting", "Marketing Automation & CRM"] },
  { id: "thought_leadership", label: "Build thought leadership", defaultKpi: "Top 10", relatedServices: ["Content Marketing", "SEO", "Social Media Management", "Content & Copywriting", "SEO & Organic Growth", "Social Media"] },
  { id: "other", label: "Other", defaultKpi: "", relatedServices: [] },
];

export interface SelectedGoal {
  id: string;
  label: string;
  kpi: string;
}

const industryOptions = ['Technology', 'Healthcare', 'Finance', 'E-commerce', 'Education', 'Real Estate', 'Manufacturing', 'Media', 'Non-profit', 'Professional Services', 'Retail', 'Other'];

interface ClientZoneProps {
  isGuestMode: boolean;
  clients: any[];
  selectedClient: any;
  setSelectedClient: (c: any) => void;
  newClientName: string;
  setNewClientName: (v: string) => void;
  newContactName: string;
  setNewContactName: (v: string) => void;
  newClientWebsite: string;
  setNewClientWebsite: (v: string) => void;
  clientChallenges: string[];
  setClientChallenges: (v: string[]) => void;
  clientChallengeOther: string;
  setClientChallengeOther: (v: string) => void;
  selectedGoals: SelectedGoal[];
  setSelectedGoals: (v: SelectedGoal[]) => void;
  goalOtherLabel: string;
  setGoalOtherLabel: (v: string) => void;
  clientContextNote: string;
  setClientContextNote: (v: string) => void;
}

export function ClientZone({
  isGuestMode, clients, selectedClient, setSelectedClient,
  newClientName, setNewClientName, newContactName, setNewContactName,
  newClientWebsite, setNewClientWebsite,
  clientChallenges, setClientChallenges, clientChallengeOther, setClientChallengeOther,
  selectedGoals, setSelectedGoals, goalOtherLabel, setGoalOtherLabel,
  clientContextNote, setClientContextNote,
}: ClientZoneProps) {
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showClientContext, setShowClientContext] = useState(false);
  const [clientContext, setClientContext] = useState('');
  const [scraping, setScraping] = useState(false);
  const [suggestedContact, setSuggestedContact] = useState<string | null>(null);
  const [clientIndustry, setClientIndustry] = useState('');

  const filteredClients = clientSearch.length > 0
    ? clients.filter((c: any) => c.company_name.toLowerCase().includes(clientSearch.toLowerCase()))
    : [];

  const toggleChallenge = (challenge: string) => {
    setClientChallenges(
      clientChallenges.includes(challenge)
        ? clientChallenges.filter(c => c !== challenge)
        : [...clientChallenges, challenge]
    );
  };

  const toggleGoal = (goalOpt: GoalOption) => {
    const existing = selectedGoals.find(g => g.id === goalOpt.id);
    if (existing) {
      setSelectedGoals(selectedGoals.filter(g => g.id !== goalOpt.id));
    } else {
      setSelectedGoals([...selectedGoals, { id: goalOpt.id, label: goalOpt.label, kpi: goalOpt.defaultKpi }]);
    }
  };

  const updateGoalKpi = (goalId: string, kpi: string) => {
    setSelectedGoals(selectedGoals.map(g => g.id === goalId ? { ...g, kpi } : g));
  };

  const handleAutoFill = async () => {
    if (!newClientWebsite.trim()) return;
    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-website', {
        body: { url: newClientWebsite.trim() },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); setScraping(false); return; }
      if (data?.name && !newClientName) {
        setNewClientName(data.name);
        setClientSearch(data.name);
      }
      if (data?.email) setSuggestedContact(data.email);
      
      const rawParts: string[] = [];
      if (data?.tagline) rawParts.push(data.tagline);
      if (data?.about_text) rawParts.push(data.about_text);
      if (data?.detected_services?.length > 0) rawParts.push(`Services: ${data.detected_services.join(', ')}`);
      
      if (rawParts.length > 0 && !clientContext) {
        try {
          const { data: summaryData } = await supabase.functions.invoke('summarize-client', {
            body: { scraped_text: rawParts.join('\n'), company_name: data?.name || newClientName },
          });
          if (summaryData?.summary) setClientContext(summaryData.summary);
          else setClientContext(rawParts.join('\n'));
          if (summaryData?.industry && !clientIndustry) setClientIndustry(summaryData.industry);
        } catch {
          setClientContext(rawParts.join('\n'));
        }
        setShowClientContext(true);
      }
      toast.success(`Auto-filled ${data?.fields_found || 0} fields from website`);
    } catch {
      toast.error('Failed to scan website');
    }
    setScraping(false);
  };

  return (
    <>
      {/* Zone 1: Client */}
      <section className="rounded-xl border border-parchment bg-card p-6 shadow-card">
        <p className="mb-4 text-[14px] font-semibold text-foreground">Who is this proposal for?</p>

        {selectedClient ? (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
              {selectedClient.company_name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{selectedClient.company_name}</p>
              {selectedClient.contact_name && (
                <p className="text-xs text-muted-foreground">{selectedClient.contact_name}{selectedClient.contact_email ? ` · ${selectedClient.contact_email}` : ''}</p>
              )}
            </div>
            <button onClick={() => { setSelectedClient(null); setClientSearch(''); }} className="text-xs text-foreground/60 hover:text-foreground">Change</button>
          </div>
        ) : (
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={isGuestMode ? "Type the company name for your first proposal..." : "Search existing clients or type a new company name..."}
                value={clientSearch}
                onChange={(e) => { setClientSearch(e.target.value); setNewClientName(e.target.value); setShowClientDropdown(true); }}
                onFocus={() => setShowClientDropdown(true)}
                onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                className="w-full rounded-lg border border-parchment bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-foreground/5"
              />
              {showClientDropdown && clientSearch.length > 0 && filteredClients.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-parchment bg-card shadow-lg">
                  {filteredClients.slice(0, 5).map((c: any) => (
                    <button
                      key={c.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setSelectedClient(c); setShowClientDropdown(false); setClientSearch(''); }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                        {c.company_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.company_name}</p>
                        {c.contact_name && <p className="text-xs text-muted-foreground">{c.contact_name}</p>}
                      </div>
                    </button>
                  ))}
                  <div className="border-t border-parchment px-4 py-2">
                    <button onMouseDown={(e) => e.preventDefault()} onClick={() => setShowClientDropdown(false)} className="text-xs text-foreground/60 hover:text-foreground">
                      Create "{clientSearch}" as new client
                    </button>
                  </div>
                </div>
              )}
            </div>

            {clientSearch && !selectedClient && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      placeholder="Contact Name"
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      className="w-full rounded-lg border border-parchment bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none"
                    />
                    {suggestedContact && !newContactName && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">Suggested: "{suggestedContact}" from website</span>
                        <button
                          onClick={() => { setNewContactName(suggestedContact); setSuggestedContact(null); }}
                          className="text-[11px] font-medium text-foreground/60 hover:text-foreground"
                        >
                          Use this
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="relative">
                      <input
                        placeholder="Client Website URL"
                        value={newClientWebsite}
                        onChange={(e) => setNewClientWebsite(e.target.value)}
                        className="w-full rounded-lg border border-parchment bg-background px-3 py-2 pr-20 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none"
                      />
                      {newClientWebsite.trim() && (
                        <button
                          type="button"
                          onClick={handleAutoFill}
                          disabled={scraping}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-md bg-brand px-2.5 py-1 text-[10px] font-medium text-white hover:bg-brand/90 disabled:opacity-50"
                        >
                          {scraping ? <Loader2 className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}
                          {scraping ? 'Scanning...' : 'Auto-fill'}
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">We'll read publicly available information from this website.</p>
                  </div>
                </div>

                {(clientIndustry || newClientName) && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Industry:</span>
                    <select
                      value={clientIndustry}
                      onChange={(e) => setClientIndustry(e.target.value)}
                      className="rounded-md border border-parchment bg-background px-2 py-1 text-xs text-foreground focus:outline-none"
                    >
                      <option value="">Select...</option>
                      {industryOptions.map(ind => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  onClick={() => setShowClientContext(!showClientContext)}
                  className="text-xs text-foreground/60 hover:text-foreground"
                >
                  {showClientContext ? '− Hide client context' : '+ About this client'}
                </button>
                {showClientContext && (
                  <textarea
                    placeholder="E.g., B2B SaaS company, 50 employees, looking to rebrand and increase inbound leads..."
                    value={clientContext}
                    onChange={(e) => setClientContext(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-parchment bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none resize-none"
                  />
                )}
              </div>
            )}
          </div>
        )}
      </section>

    </>
  );
}

/* ── Client Context Zone (challenges, goals, quick note) ── */
interface ClientContextZoneProps {
  visible: boolean;
  clientChallenges: string[];
  setClientChallenges: (v: string[]) => void;
  clientChallengeOther: string;
  setClientChallengeOther: (v: string) => void;
  selectedGoals: SelectedGoal[];
  setSelectedGoals: (v: SelectedGoal[]) => void;
  goalOtherLabel: string;
  setGoalOtherLabel: (v: string) => void;
  clientContextNote: string;
  setClientContextNote: (v: string) => void;
}

export function ClientContextZone({
  visible,
  clientChallenges, setClientChallenges, clientChallengeOther, setClientChallengeOther,
  selectedGoals, setSelectedGoals, goalOtherLabel, setGoalOtherLabel,
  clientContextNote, setClientContextNote,
}: ClientContextZoneProps) {
  const toggleChallenge = (challenge: string) => {
    setClientChallenges(
      clientChallenges.includes(challenge)
        ? clientChallenges.filter(c => c !== challenge)
        : [...clientChallenges, challenge]
    );
  };

  const toggleGoal = (goalOpt: GoalOption) => {
    const existing = selectedGoals.find(g => g.id === goalOpt.id);
    if (existing) {
      setSelectedGoals(selectedGoals.filter(g => g.id !== goalOpt.id));
    } else {
      setSelectedGoals([...selectedGoals, { id: goalOpt.id, label: goalOpt.label, kpi: goalOpt.defaultKpi }]);
    }
  };

  const updateGoalKpi = (goalId: string, kpi: string) => {
    setSelectedGoals(selectedGoals.map(g => g.id === goalId ? { ...g, kpi } : g));
  };

  if (!visible) return null;

  return (
    <section className="rounded-xl border border-parchment bg-card p-6 shadow-card">
      <p className="mb-1 text-[14px] font-semibold text-foreground">Client context</p>
      <p className="mb-4 text-xs text-muted-foreground">Optional — makes the proposal more specific to this client</p>
      
      <div className="space-y-4">
        {/* Multi-select challenges */}
        <div>
          <label className="mb-2 block text-xs font-medium text-muted-foreground">Key challenges <span className="text-muted-foreground/60">(select all that apply)</span></label>
          
          {clientChallenges.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {clientChallenges.map(challenge => (
                <span
                  key={challenge}
                  className="inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand/5 px-2.5 py-1 text-[11px] font-medium text-foreground"
                >
                  {challenge === 'Other' ? (clientChallengeOther || 'Other') : challenge}
                  <button onClick={() => toggleChallenge(challenge)} className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {challengeOptions.map(option => {
              const isSelected = clientChallenges.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleChallenge(option)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                    isSelected ? 'bg-brand/5 text-foreground font-medium' : 'text-foreground/70 hover:bg-muted/50'
                  }`}
                >
                  <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                    isSelected ? 'border-brand bg-brand text-white' : 'border-foreground/20'
                  }`}>
                    {isSelected && <Check className="h-2.5 w-2.5" />}
                  </div>
                  {option}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => toggleChallenge('Other')}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                clientChallenges.includes('Other') ? 'bg-brand/5 text-foreground font-medium' : 'text-foreground/70 hover:bg-muted/50'
              }`}
            >
              <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                clientChallenges.includes('Other') ? 'border-brand bg-brand text-white' : 'border-foreground/20'
              }`}>
                {clientChallenges.includes('Other') && <Check className="h-2.5 w-2.5" />}
              </div>
              Other
            </button>
          </div>
          {clientChallenges.includes('Other') && (
            <input
              type="text"
              placeholder="Describe the challenge..."
              maxLength={100}
              value={clientChallengeOther}
              onChange={(e) => setClientChallengeOther(e.target.value)}
              className="mt-2 w-full rounded-lg border border-parchment bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none"
            />
          )}
        </div>

        {/* Multi-select goals with KPI targets */}
        <div>
          <label className="mb-2 block text-xs font-medium text-muted-foreground">Goals <span className="text-muted-foreground/60">(select all that apply)</span></label>
          
          {selectedGoals.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {selectedGoals.map(goal => (
                <span
                  key={goal.id}
                  className="inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand/5 px-2.5 py-1 text-[11px] font-medium text-foreground"
                >
                  {goal.id === 'other' ? (goalOtherLabel || 'Other') : goal.label}
                  {goal.kpi && <span className="text-brand font-semibold">{goal.kpi}</span>}
                  <button onClick={() => toggleGoal(goalOptionsList.find(g => g.id === goal.id)!)} className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="space-y-0.5">
            {goalOptionsList.map(goalOpt => {
              const isSelected = selectedGoals.some(g => g.id === goalOpt.id);
              const selectedGoal = selectedGoals.find(g => g.id === goalOpt.id);
              return (
                <div key={goalOpt.id}>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleGoal(goalOpt)}
                      className={`flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                        isSelected ? 'bg-brand/5 text-foreground font-medium' : 'text-foreground/70 hover:bg-muted/50'
                      }`}
                    >
                      <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                        isSelected ? 'border-brand bg-brand text-white' : 'border-foreground/20'
                      }`}>
                        {isSelected && <Check className="h-2.5 w-2.5" />}
                      </div>
                      {goalOpt.id === 'other' ? 'Other' : goalOpt.label}
                    </button>
                    {isSelected && goalOpt.id !== 'other' && (
                      <input
                        type="text"
                        value={selectedGoal?.kpi || ''}
                        onChange={(e) => updateGoalKpi(goalOpt.id, e.target.value)}
                        placeholder={goalOpt.defaultKpi}
                        className="w-20 rounded-md border border-parchment bg-background px-2 py-1.5 text-xs text-center text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none"
                      />
                    )}
                  </div>
                  {isSelected && goalOpt.id === 'other' && (
                    <div className="ml-9 mt-1 flex gap-2">
                      <input
                        type="text"
                        placeholder="Goal name..."
                        maxLength={80}
                        value={goalOtherLabel}
                        onChange={(e) => setGoalOtherLabel(e.target.value)}
                        className="flex-1 rounded-md border border-parchment bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="KPI target"
                        value={selectedGoal?.kpi || ''}
                        onChange={(e) => updateGoalKpi('other', e.target.value)}
                        className="w-20 rounded-md border border-parchment bg-background px-2 py-1.5 text-xs text-center text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick note */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Quick note</label>
          <input
            type="text"
            placeholder="e.g. They just raised a round and need to scale quickly"
            maxLength={200}
            value={clientContextNote}
            onChange={(e) => setClientContextNote(e.target.value)}
            className="w-full rounded-lg border border-parchment bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none"
          />
        </div>
      </div>
    </section>
  );
}
