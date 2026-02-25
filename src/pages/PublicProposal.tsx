import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, ChevronDown, Check, Clock, AlertTriangle } from 'lucide-react';

export default function PublicProposal() {
  const { shareId } = useParams<{ shareId: string }>();
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [proposal, setProposal] = useState<any>(null);
  const [agency, setAgency] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [differentiators, setDifferentiators] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [termsClauses, setTermsClauses] = useState<any[]>([]);

  useEffect(() => {
    if (shareId) loadProposal();
  }, [shareId]);

  const loadProposal = async () => {
    // Look up share
    const { data: share } = await supabase
      .from('proposal_shares')
      .select('*')
      .eq('share_id', shareId!)
      .eq('is_active', true)
      .single();

    if (!share) { setExpired(true); setLoading(false); return; }
    if (share.expires_at && new Date(share.expires_at) < new Date()) { setExpired(true); setLoading(false); return; }

    // Load proposal
    const { data: prop } = await supabase.from('proposals').select('*').eq('id', share.proposal_id).single();
    if (!prop) { setExpired(true); setLoading(false); return; }
    setProposal(prop);

    // Track view & mark as viewed
    if (prop.status === 'sent') {
      await supabase.from('proposals').update({ status: 'viewed', viewed_at: new Date().toISOString() }).eq('id', prop.id);
    }
    await supabase.from('proposal_analytics').insert({
      proposal_id: prop.id,
      event_type: 'view',
      user_agent: navigator.userAgent,
    });

    // Load related data in parallel
    const [agencyRes, clientRes, svcRes, diffRes, testRes, termsRes] = await Promise.all([
      prop.agency_id ? supabase.from('agencies').select('*').eq('id', prop.agency_id).single() : { data: null },
      prop.client_id ? supabase.from('clients').select('*').eq('id', prop.client_id).single() : { data: null },
      supabase.from('proposal_services').select('*, service_modules(name, description, short_description, pricing_model, price_fixed, price_monthly, price_hourly, deliverables, icon)').eq('proposal_id', prop.id).order('display_order'),
      prop.agency_id ? supabase.from('differentiators').select('*').eq('agency_id', prop.agency_id).order('display_order') : { data: [] },
      prop.agency_id ? supabase.from('testimonials').select('*').eq('agency_id', prop.agency_id).order('created_at', { ascending: false }) : { data: [] },
      prop.agency_id ? supabase.from('terms_clauses').select('*').eq('agency_id', prop.agency_id).order('display_order') : { data: [] },
    ]);

    setAgency(agencyRes.data);
    setClient(clientRes.data);
    setServices((svcRes.data || []).map((s: any) => ({ ...s, module: s.service_modules })));
    setDifferentiators(diffRes.data || []);
    setTestimonials(testRes.data || []);
    setTermsClauses(termsRes.data || []);
    setLoading(false);
  };

  const getPrice = (s: any) => s.price_override ?? s.module?.price_fixed ?? s.module?.price_monthly ?? s.module?.price_hourly ?? 0;
  const suffix = (m: string | null) => m === 'monthly' ? '/mo' : m === 'hourly' ? '/hr' : '';
  const currencySymbol = agency?.currency_symbol || '$';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (expired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-status-warning" />
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Proposal Expired</h1>
          <p className="mt-2 text-sm text-muted-foreground">This proposal link is no longer active. Please contact the agency for an updated version.</p>
        </div>
      </div>
    );
  }

  const fixedSvcs = services.filter(s => s.module?.pricing_model === 'fixed');
  const monthlySvcs = services.filter(s => s.module?.pricing_model === 'monthly');
  const isMixed = fixedSvcs.length > 0 && monthlySvcs.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Brand Bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: agency?.brand_color || 'hsl(18, 96%, 71%)' }} />

      <div className="mx-auto max-w-[800px] px-6 py-10 space-y-10">
        {/* Cover */}
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          {agency?.logo_url && <img src={agency.logo_url} alt="" className="mx-auto mb-6 h-12 object-contain" />}
          <h1 className="font-display text-3xl font-bold text-foreground">{proposal.title || 'Proposal'}</h1>
          {proposal.subtitle && <p className="mt-2 text-lg text-muted-foreground">{proposal.subtitle}</p>}
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span>Prepared for <strong className="text-foreground">{client?.company_name || 'Client'}</strong></span>
            <span>•</span>
            <span>{new Date(proposal.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Executive Summary */}
        {proposal.executive_summary && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 font-display text-lg font-bold text-foreground">Executive Summary</h2>
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{proposal.executive_summary}</p>
          </div>
        )}

        {/* Scope of Services */}
        {services.length > 0 && (
          <div>
            <h2 className="mb-4 font-display text-lg font-bold text-foreground">Scope of Services</h2>
            <div className="space-y-4">
              {services.map((svc) => (
                <div key={svc.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-foreground">{svc.module?.name || 'Service'}</h4>
                      <p className="mt-1 text-xs text-muted-foreground">{svc.module?.description || svc.module?.short_description || ''}</p>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-foreground">
                      {currencySymbol}{getPrice(svc).toLocaleString()}{suffix(svc.module?.pricing_model)}
                    </span>
                  </div>
                  {svc.module?.deliverables?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {svc.module.deliverables.map((d: string, i: number) => (
                        <span key={i} className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] text-muted-foreground">{d}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        {proposal.project_start_date && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 font-display text-lg font-bold text-foreground">Timeline</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Start: <strong className="text-foreground">{new Date(proposal.project_start_date).toLocaleDateString()}</strong></span>
              {proposal.estimated_duration && (
                <>
                  <span>•</span>
                  <span>Duration: <strong className="text-foreground">{proposal.estimated_duration}</strong></span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Investment */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">Investment</h2>
          {isMixed ? (
            <>
              {fixedSvcs.length > 0 && (
                <div className="mb-4">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">Project Fees</p>
                  {fixedSvcs.map(s => (
                    <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm text-foreground">{s.module?.name}</span>
                      <span className="text-sm font-semibold tabular-nums text-foreground">{currencySymbol}{getPrice(s).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              {monthlySvcs.length > 0 && (
                <div className="mb-4">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">Monthly Retainers</p>
                  {monthlySvcs.map(s => (
                    <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm text-foreground">{s.module?.name}</span>
                      <span className="text-sm font-semibold tabular-nums text-foreground">{currencySymbol}{getPrice(s).toLocaleString()}/mo</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="mb-4">
              {services.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-foreground">{s.module?.name}</span>
                  <span className="text-sm font-semibold tabular-nums text-foreground">{currencySymbol}{getPrice(s).toLocaleString()}{suffix(s.module?.pricing_model)}</span>
                </div>
              ))}
            </div>
          )}
          {(proposal.bundle_savings ?? 0) > 0 && (
            <div className="flex items-center justify-between py-2 text-status-success">
              <span className="text-sm font-medium">Bundle Savings</span>
              <span className="text-sm font-semibold tabular-nums">-{currencySymbol}{(proposal.bundle_savings || 0).toLocaleString()}</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between border-t-2 pt-3" style={{ borderColor: agency?.brand_color || 'hsl(18, 96%, 71%)' }}>
            <span className="text-base font-bold text-foreground">Total Investment</span>
            <span className="font-display text-xl font-bold tabular-nums text-foreground">
              {(proposal.total_fixed ?? 0) > 0 && `${currencySymbol}${(proposal.total_fixed || 0).toLocaleString()}`}
              {(proposal.total_fixed ?? 0) > 0 && (proposal.total_monthly ?? 0) > 0 && ' + '}
              {(proposal.total_monthly ?? 0) > 0 && `${currencySymbol}${(proposal.total_monthly || 0).toLocaleString()}/mo`}
              {(proposal.total_fixed ?? 0) === 0 && (proposal.total_monthly ?? 0) === 0 && `${currencySymbol}0`}
            </span>
          </div>
        </div>

        {/* Why Us */}
        {differentiators.length > 0 && (
          <div>
            <h2 className="mb-4 font-display text-lg font-bold text-foreground">Why {agency?.name || 'Us'}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {differentiators.map((d) => (
                <div key={d.id} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm font-semibold text-foreground">{d.title}</p>
                  {d.description && <p className="mt-1 text-xs text-muted-foreground">{d.description}</p>}
                  {d.stat_value && (
                    <div className="mt-2">
                      <span className="font-display text-lg font-bold" style={{ color: agency?.brand_color }}>{d.stat_value}</span>
                      {d.stat_label && <span className="ml-1 text-xs text-muted-foreground">{d.stat_label}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <div>
            <h2 className="mb-4 font-display text-lg font-bold text-foreground">What Our Clients Say</h2>
            <div className="space-y-4">
              {testimonials.slice(0, 3).map((t) => (
                <div key={t.id} className="rounded-xl border border-border bg-card p-5">
                  <p className="text-sm italic text-foreground">"{t.quote}"</p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-primary-foreground" style={{ backgroundColor: agency?.brand_color || 'hsl(18, 96%, 71%)' }}>
                      {t.client_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">{t.client_name}</p>
                      <p className="text-[10px] text-muted-foreground">{t.client_title}{t.client_company ? `, ${t.client_company}` : ''}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Terms */}
        {termsClauses.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-display text-lg font-bold text-foreground">Terms & Conditions</h2>
            <div className="space-y-3">
              {termsClauses.map((clause) => (
                <details key={clause.id} className="group">
                  <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-foreground">
                    {clause.title}
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{clause.content}</p>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* Signature */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">Agreement</h2>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-3">Agency</p>
              <p className="text-sm font-semibold text-foreground">{agency?.name}</p>
              {agency?.email && <p className="text-xs text-muted-foreground">{agency.email}</p>}
              <div className="mt-6 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                <p className="text-xs text-muted-foreground">Signature</p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Date: _______________</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-3">Client</p>
              <p className="text-sm font-semibold text-foreground">{client?.company_name}</p>
              {client?.contact_name && <p className="text-xs text-muted-foreground">{client.contact_name}</p>}
              <div className="mt-6 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                <p className="text-xs text-muted-foreground">Signature</p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Date: _______________</p>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Valid for {proposal.validity_days || 30} days from {new Date(proposal.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">Powered by <span className="font-semibold">Propopad</span></p>
        </div>
      </div>
    </div>
  );
}
