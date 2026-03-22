import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'needs-auth' | 'accepting' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  // Signup form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLogin, setIsLogin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('No invite token provided.');
      return;
    }
    checkAuth();
  }, [token]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await acceptInvite(session.user.id);
    } else {
      setStatus('needs-auth');
    }
  };

  const acceptInvite = async (userId: string) => {
    setStatus('accepting');
    const { data, error } = await supabase.functions.invoke('manage-team-invite', {
      body: { action: 'accept-invite', token, user_id: userId },
    });

    if (error || data?.error) {
      setStatus('error');
      setErrorMsg(data?.error || 'Failed to accept invite.');
      return;
    }

    toast.success('Welcome to the team!');
    // Force reload to refresh auth context with new agency
    window.location.href = '/dashboard';
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        setSubmitting(false);
        return;
      }
      if (data.user) await acceptInvite(data.user.id);
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) {
        toast.error(error.message);
        setSubmitting(false);
        return;
      }
      if (data.user) {
        // If email confirmation is required, user won't have a session yet
        if (!data.session) {
          toast.success('Check your email to confirm your account, then click the invite link again.');
          setStatus('error');
          setErrorMsg('Please confirm your email first, then click the invite link again.');
          setSubmitting(false);
          return;
        }
        await acceptInvite(data.user.id);
      }
    }
    setSubmitting(false);
  };

  const inputCls = 'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

  if (status === 'loading' || status === 'accepting') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand" />
          <p className="mt-3 text-sm text-muted-foreground">
            {status === 'accepting' ? 'Joining team...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
          <p className="text-lg font-semibold text-foreground">Unable to join</p>
          <p className="mt-2 text-sm text-muted-foreground">{errorMsg}</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 rounded-lg bg-ink px-6 py-2.5 text-sm font-medium text-ivory hover:opacity-90"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
        <h1 className="text-xl font-bold text-foreground">
          {isLogin ? 'Sign in to accept invite' : 'Create an account to join'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You've been invited to join a team on Propopad.
        </p>

        <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
          {!isLogin && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className={inputCls}
                required
              />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className={inputCls}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputCls}
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-ink py-2.5 text-sm font-medium text-ivory hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Please wait...' : isLogin ? 'Sign in & join team' : 'Create account & join team'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-medium text-brand hover:underline"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
