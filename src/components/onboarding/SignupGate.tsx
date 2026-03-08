import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import propopadLogo from '@/assets/logo_propopad_small.svg';
import { Loader2 } from 'lucide-react';

export type SignupTrigger = 'share' | 'download' | 'navigate' | 'new_proposal' | 'default';

const triggerContent: Record<SignupTrigger, { headline: string; subtitle: (clientName?: string) => string; button: string }> = {
  share: {
    headline: 'Create your free account to send this proposal',
    subtitle: (clientName) => `Your proposal is ready. Sign up to share it with ${clientName || 'your client'} and start tracking responses.`,
    button: 'Create account & send',
  },
  download: {
    headline: 'Create your free account to download',
    subtitle: () => 'Sign up to export this proposal as a PDF and start sending to clients.',
    button: 'Create account & download',
  },
  navigate: {
    headline: 'Create your free account',
    subtitle: () => 'Sign up to access your dashboard, manage clients, and create more proposals.',
    button: 'Create account',
  },
  new_proposal: {
    headline: 'Create your free account to make more proposals',
    subtitle: () => "You've built a great first proposal. Sign up to create unlimited proposals and manage your pipeline.",
    button: 'Create account',
  },
  default: {
    headline: 'Create your account to save',
    subtitle: () => 'Your agency profile is ready. Sign up to save it and start sending proposals.',
    button: 'Create account & save',
  },
};

interface SignupGateProps {
  onAuthenticated: () => void;
  onCancel: () => void;
  trigger?: SignupTrigger;
  clientName?: string;
}

export function SignupGate({ onAuthenticated, onCancel, trigger = 'default', clientName }: SignupGateProps) {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const content = triggerContent[trigger];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      toast.success('Account created!');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
    }

    setTimeout(() => {
      setLoading(false);
      onAuthenticated();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-card-hover">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 text-xs text-muted-foreground hover:text-foreground"
        >
          ← Back to editing
        </button>

        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden">
            <img src={propopadLogo} alt="" className="h-8 w-8" />
          </div>
          <span className="font-display text-base font-bold text-foreground">Propopad</span>
        </div>

        <h2 className="font-display text-xl font-bold text-foreground">
          {mode === 'signup' ? content.headline : 'Sign in to continue'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === 'signup' ? content.subtitle(clientName) : 'Sign in to your existing account to continue.'}
        </p>

        <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          )}
          <input
            type="email"
            placeholder="Work email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          <input
            type="password"
            placeholder={mode === 'signup' ? 'Create password (6+ chars)' : 'Password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === 'signup' ? 6 : undefined}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />

          {mode === 'signup' && (
            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-brand focus:ring-brand/20"
              />
              <span className="text-[12px] text-muted-foreground">
                I agree to the{' '}
                <Link to="/terms" target="_blank" className="font-medium underline text-foreground">Terms</Link>
                {' '}and{' '}
                <Link to="/privacy" target="_blank" className="font-medium underline text-foreground">Privacy Policy</Link>
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading || (mode === 'signup' && !agreed)}
            className="!mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-ink py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-ink-soft disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'signup' ? content.button : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {mode === 'signup' ? (
            <>Already have an account?{' '}<button onClick={() => setMode('login')} className="font-medium text-brand hover:text-brand-hover">Sign in</button></>
          ) : (
            <>Need an account?{' '}<button onClick={() => setMode('signup')} className="font-medium text-brand hover:text-brand-hover">Sign up</button></>
          )}
        </p>
      </div>
    </div>
  );
}
