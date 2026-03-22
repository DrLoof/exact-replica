import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function HubSpotCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setStatus('error');
      setErrorMsg('No authorization code received from HubSpot.');
      return;
    }

    exchangeCode(code);
  }, []);

  const exchangeCode = async (code: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('hubspot-oauth-callback', {
        body: { code, redirectUri: `${window.location.origin}/settings/integrations/hubspot/callback` },
      });

      if (error || data?.error) {
        setStatus('error');
        setErrorMsg(data?.error || error?.message || 'Failed to connect HubSpot.');
        return;
      }

      setStatus('success');
      setTimeout(() => navigate('/settings/integrations'), 2000);
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e.message || 'An unexpected error occurred.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory">
      <div className="mx-auto max-w-sm rounded-xl bg-paper p-8 text-center shadow-card">
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-ink-muted" />
            <h2 className="mt-4 text-lg font-semibold text-ink">Connecting HubSpot…</h2>
            <p className="mt-2 text-sm text-ink-muted">Please wait while we complete the connection.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="mx-auto h-10 w-10" style={{ color: '#2E7D32' }} />
            <h2 className="mt-4 text-lg font-semibold text-ink">HubSpot Connected!</h2>
            <p className="mt-2 text-sm text-ink-muted">Redirecting to integrations settings…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-red-500" />
            <h2 className="mt-4 text-lg font-semibold text-ink">Connection Failed</h2>
            <p className="mt-2 text-sm text-ink-muted">{errorMsg}</p>
            <button
              onClick={() => navigate('/settings/integrations')}
              className="mt-4 rounded-lg px-4 py-2 text-sm font-medium text-ivory"
              style={{ backgroundColor: '#2A2118' }}
            >
              Back to Integrations
            </button>
          </>
        )}
      </div>
    </div>
  );
}
