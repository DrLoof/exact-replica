import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePlan } from '@/hooks/usePlan';
import { UpgradeModal } from '@/components/UpgradeModal';
import { ImportContactsModal } from '@/components/integrations/ImportContactsModal';
import { toast } from 'sonner';
import { Plug, ExternalLink, RefreshCw, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Integration {
  id: string;
  agency_id: string;
  provider: string;
  hub_id: string | null;
  settings: any;
  sync_enabled: boolean;
  last_synced_at: string | null;
  status: string;
  error_message: string | null;
}

interface HubSpotPipelineStage {
  stageId: string;
  label: string;
}

const PROPOSAL_STATUSES = [
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'viewed', label: 'Viewed' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'declined', label: 'Declined' },
];

export default function SettingsIntegrations() {
  const { agency } = useAuth();
  const { effectivePlan } = usePlan();
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [stages, setStages] = useState<HubSpotPipelineStage[]>([]);
  const [settings, setSettings] = useState<any>({
    sync_proposals: true,
    sync_clients: true,
    import_contacts: true,
    auto_create_deals: true,
    pipeline_id: 'default',
    stage_mapping: {},
  });

  const canUseIntegrations = effectivePlan && ['pro', 'business'].includes(effectivePlan.id);

  useEffect(() => {
    if (agency?.id) fetchIntegration();
  }, [agency?.id]);

  const fetchIntegration = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('integrations')
      .select('*')
      .eq('agency_id', agency!.id)
      .eq('provider', 'hubspot')
      .maybeSingle();

    if (data) {
      setIntegration(data as unknown as Integration);
      const s = (data as any).settings || {};
      setSettings({
        sync_proposals: s.sync_proposals ?? true,
        sync_clients: s.sync_clients ?? true,
        import_contacts: s.import_contacts ?? true,
        auto_create_deals: s.auto_create_deals ?? true,
        pipeline_id: s.pipeline_id || 'default',
        stage_mapping: s.stage_mapping || {},
      });

      if ((data as any).status === 'active') {
        fetchPipelineStages();
      }
    }
    setLoading(false);
  };

  const fetchPipelineStages = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('hubspot-get-stages', {
        body: { agencyId: agency!.id },
      });
      if (data?.stages) {
        setStages(data.stages);
      }
    } catch (e) {
      // Stages will be empty, user can still configure manually
    }
  };

  const handleConnect = () => {
    if (!canUseIntegrations) {
      setUpgradeOpen(true);
      return;
    }
    // Redirect to HubSpot OAuth
    const clientId = import.meta.env.VITE_HUBSPOT_CLIENT_ID;
    const redirectUri = `${window.location.origin}/settings/integrations/hubspot/callback`;
    const scopes = 'crm.objects.contacts.read crm.objects.contacts.write crm.objects.deals.read crm.objects.deals.write crm.objects.companies.read crm.objects.companies.write';
    window.location.href = `https://app.hubspot.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
  };

  const handleDisconnect = async () => {
    if (!integration) return;
    setDisconnecting(true);
    const { error } = await supabase.functions.invoke('hubspot-disconnect', {
      body: { agencyId: agency!.id },
    });
    if (error) {
      toast.error('Failed to disconnect HubSpot');
    } else {
      toast.success('HubSpot disconnected');
      setIntegration(null);
    }
    setDisconnecting(false);
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    const { error } = await supabase.functions.invoke('hubspot-sync', {
      body: { agencyId: agency!.id },
    });
    if (error) {
      toast.error('Sync failed');
    } else {
      toast.success('Sync completed');
      fetchIntegration();
    }
    setSyncing(false);
  };

  const handleImportContacts = () => {
    setImportModalOpen(true);
  };

  const handleSettingsChange = async (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    if (integration) {
      await supabase
        .from('integrations')
        .update({ settings: newSettings } as any)
        .eq('id', integration.id);
    }
  };

  const handleStageMapping = async (proposalStatus: string, hubspotStage: string) => {
    const newMapping = { ...settings.stage_mapping, [proposalStatus]: hubspotStage };
    handleSettingsChange('stage_mapping', newMapping);
  };

  const isConnected = integration?.status === 'active';
  const isError = integration?.status === 'error';

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-8 py-10 px-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Integrations</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Connect Propopad with the tools your agency already uses.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* HubSpot Card */}
            <div className="rounded-xl bg-paper p-6 shadow-card">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: '#FF7A59' }}>
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
                    <path d="M17.69 13.13c-.57 0-1.08.23-1.46.6l-2.72-1.69c.1-.33.16-.69.16-1.06 0-.31-.04-.6-.13-.88l2.73-1.72c.37.35.87.56 1.42.56 1.14 0 2.07-.93 2.07-2.07S18.83 4.8 17.69 4.8s-2.07.93-2.07 2.07c0 .18.02.35.07.51l-2.74 1.73c-.62-.72-1.54-1.18-2.57-1.18-1.87 0-3.39 1.52-3.39 3.39 0 .67.2 1.29.53 1.82L5.8 14.79c-.23-.1-.48-.15-.74-.15-.97 0-1.76.79-1.76 1.76s.79 1.76 1.76 1.76 1.76-.79 1.76-1.76c0-.22-.04-.43-.12-.62l1.73-1.67c.62.49 1.4.78 2.24.78.96 0 1.83-.38 2.47-1l2.7 1.68c-.06.18-.09.37-.09.57 0 1.14.93 2.07 2.07 2.07s2.07-.93 2.07-2.07-.93-2.07-2.07-2.07h-.13z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[16px] font-semibold" style={{ color: '#2A2118' }}>HubSpot CRM</h3>
                    {isConnected && (
                      <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}>
                        <Check className="h-3 w-3" /> Connected
                      </span>
                    )}
                    {isError && (
                      <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: '#FFF3E0', color: '#E65100' }}>
                        <AlertTriangle className="h-3 w-3" /> Error
                      </span>
                    )}
                  </div>

                  {isConnected && integration?.hub_id && (
                    <p className="mt-0.5 text-[12px]" style={{ color: '#8A7F72' }}>
                      Portal ID: {integration.hub_id}
                      {integration.last_synced_at && (
                        <> · Last synced: {formatDistanceToNow(new Date(integration.last_synced_at), { addSuffix: true })}</>
                      )}
                    </p>
                  )}

                  {!isConnected && !isError && (
                    <p className="mt-1 text-[13px]" style={{ color: '#8A7F72' }}>
                      Sync clients, deals, and proposal status automatically.
                      Import your contacts and keep your pipeline in sync.
                    </p>
                  )}

                  {isError && (
                    <p className="mt-1 text-[13px]" style={{ color: '#E65100' }}>
                      {integration?.error_message || 'Connection error. Please reconnect.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Not connected: show connect button */}
              {!isConnected && !isError && (
                <div className="mt-4">
                  <button
                    onClick={handleConnect}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-ivory transition-colors hover:opacity-90"
                    style={{ backgroundColor: '#2A2118' }}
                  >
                    Connect HubSpot →
                  </button>
                </div>
              )}

              {/* Error state: show reconnect */}
              {isError && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleConnect}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-ivory transition-colors hover:opacity-90"
                    style={{ backgroundColor: '#2A2118' }}
                  >
                    Reconnect HubSpot
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-parchment-soft"
                    style={{ borderColor: '#EEEAE3', color: '#8A7F72' }}
                  >
                    {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                </div>
              )}

              {/* Connected state: settings */}
              {isConnected && (
                <div className="mt-6 space-y-6">
                  {/* Sync Settings */}
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#8A7F72' }}>Sync Settings</h4>
                    <div className="mt-3 space-y-2.5">
                      {[
                        { key: 'sync_proposals', label: 'Sync proposals → HubSpot deals' },
                        { key: 'sync_clients', label: 'Sync clients → HubSpot contacts' },
                        { key: 'import_contacts', label: 'Import HubSpot contacts → Propopad clients' },
                        { key: 'auto_create_deals', label: 'Update deal stage on proposal status change' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings[key]}
                            onChange={(e) => handleSettingsChange(key, e.target.checked)}
                            className="h-4 w-4 rounded border-ink-faint text-ink accent-ink"
                          />
                          <span className="text-[13px] text-ink">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Stage Mapping */}
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#8A7F72' }}>Stage Mapping</h4>
                    <div className="mt-3 space-y-2">
                      {PROPOSAL_STATUSES.map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-3">
                          <span className="w-24 text-[13px] font-medium text-ink">{label}</span>
                          <span className="text-[13px] text-ink-faint">→</span>
                          <select
                            value={settings.stage_mapping[key] || ''}
                            onChange={(e) => handleStageMapping(key, e.target.value)}
                            className="flex-1 rounded-lg border px-3 py-1.5 text-[13px] text-ink"
                            style={{ borderColor: '#EEEAE3', backgroundColor: '#FAFAF8' }}
                          >
                            <option value="">Select stage…</option>
                            {stages.map((stage) => (
                              <option key={stage.stageId} value={stage.stageId}>{stage.label}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid #EEEAE3' }}>
                    <button
                      onClick={handleSyncNow}
                      disabled={syncing}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-ivory transition-colors hover:opacity-90"
                      style={{ backgroundColor: '#2A2118' }}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
                      {syncing ? 'Syncing...' : 'Sync now'}
                    </button>
                    <button
                      onClick={handleImportContacts}
                      disabled={importing}
                      className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-parchment-soft"
                      style={{ borderColor: '#EEEAE3', color: '#2A2118' }}
                    >
                      {importing ? 'Importing...' : 'Import contacts'}
                    </button>
                    <button
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-parchment-soft"
                      style={{ borderColor: '#EEEAE3', color: '#8A7F72' }}
                    >
                      {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Pipedrive Card - Coming Soon */}
            <div className="rounded-xl bg-paper p-6 shadow-card opacity-75">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: '#1D1D1B' }}>
                  <span className="text-sm font-bold text-white">PD</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[16px] font-semibold" style={{ color: '#2A2118' }}>Pipedrive</h3>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ backgroundColor: '#F4F1EB', color: '#8A7F72' }}>
                      Coming Soon
                    </span>
                  </div>
                  <p className="mt-1 text-[13px]" style={{ color: '#8A7F72' }}>
                    Sync deals and contacts with your Pipedrive pipeline.
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <NotifyButton provider="pipedrive" />
              </div>
            </div>

            {/* Salesforce Card - Coming Soon */}
            <div className="rounded-xl bg-paper p-6 shadow-card opacity-75">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: '#00A1E0' }}>
                  <span className="text-sm font-bold text-white">SF</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[16px] font-semibold" style={{ color: '#2A2118' }}>Salesforce</h3>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ backgroundColor: '#F4F1EB', color: '#8A7F72' }}>
                      Coming Soon
                    </span>
                  </div>
                  <p className="mt-1 text-[13px]" style={{ color: '#8A7F72' }}>
                    Enterprise CRM integration for larger teams.
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <NotifyButton provider="salesforce" />
              </div>
            </div>
          </div>
        )}
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        feature="CRM Integrations"
        customReason="CRM integrations are available on Pro and Business plans."
      />
    </AppShell>
  );
}

function NotifyButton({ provider }: { provider: string }) {
  const { agency } = useAuth();
  const [notified, setNotified] = useState(false);

  const handleNotify = async () => {
    if (!agency?.id) return;
    // Store interest flag
    await supabase
      .from('integrations')
      .upsert({
        agency_id: agency.id,
        provider,
        status: 'interest',
        settings: { notified_at: new Date().toISOString() },
      } as any, { onConflict: 'agency_id,provider' });
    setNotified(true);
    toast.success("We'll notify you when this integration is available!");
  };

  return (
    <button
      onClick={handleNotify}
      disabled={notified}
      className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-parchment-soft disabled:opacity-50"
      style={{ borderColor: '#EEEAE3', color: '#2A2118' }}
    >
      {notified ? '✓ We\'ll notify you' : 'Notify me when available'}
    </button>
  );
}
