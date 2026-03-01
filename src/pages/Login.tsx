import propopadLogo from '@/assets/logo_propopad_small.svg';
import propopadLogoFull from '@/assets/propopad-logo-full.svg';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
    } else {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex flex-1 flex-col justify-center px-8 py-12 sm:px-16 lg:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden">
              <img src={propopadLogo} alt="Propopad" className="h-9 w-9" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">Propopad</span>
          </div>

          <h1 className="font-display text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your account to continue</p>

          <form className="mt-8 space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                placeholder="you@agency.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="block w-full rounded-lg bg-brand py-2.5 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-hover disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-brand hover:text-brand-hover">Sign up</Link>
          </p>
          <p className="mt-4 text-center">
            <Link to="/terms" className="text-[10px] hover:underline" style={{ color: '#B8B0A5' }}>Terms</Link>
            <span className="mx-1 text-[10px]" style={{ color: '#B8B0A5' }}>·</span>
            <Link to="/privacy" className="text-[10px] hover:underline" style={{ color: '#B8B0A5' }}>Privacy</Link>
          </p>
        </div>
      </div>

      <div className="hidden flex-1 items-center justify-center bg-brand lg:flex">
        <div className="max-w-md px-12 text-center">
          <img src={propopadLogoFull} alt="Propopad" className="mx-auto mb-6 h-20 w-auto opacity-90" />
          <h2 className="font-display text-3xl font-bold text-primary-foreground">
            Beautiful proposals that win clients
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Create stunning, branded proposals in minutes. Track views, get signatures, and close deals faster.
          </p>
        </div>
      </div>
    </div>
  );
}
