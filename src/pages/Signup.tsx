import propopadLogo from '@/assets/propopad-logo.svg';
import propopadLogoFull from '@/assets/propopad-logo-full.svg';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
    } else {
      toast.success('Account created! Redirecting...');
      navigate('/onboarding');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex flex-1 flex-col justify-center px-8 py-12 sm:px-16 lg:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand">
              <img src={propopadLogo} alt="Propopad" className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">Propopad</span>
          </div>

          <h1 className="font-display text-2xl font-bold text-foreground">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Start creating winning proposals in minutes</p>

          <form className="mt-8 space-y-4" onSubmit={handleSignup}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Full name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Work email</label>
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
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <label className="mt-4 flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-brand focus:ring-brand/20"
              />
              <span className="text-[12px] text-muted-foreground">
                I agree to the{' '}
                <Link to="/terms" target="_blank" className="text-[12px] font-medium underline" style={{ color: '#4A3F32' }}>Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" target="_blank" className="text-[12px] font-medium underline" style={{ color: '#4A3F32' }}>Privacy Policy</Link>
              </span>
            </label>
            <button
              type="submit"
              disabled={loading || !agreed}
              className="mt-4 block w-full rounded-lg bg-brand py-2.5 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-hover disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand hover:text-brand-hover">Sign in</Link>
          </p>
        </div>
      </div>

      <div className="hidden flex-1 items-center justify-center bg-brand lg:flex">
        <div className="max-w-md px-12 text-center">
          <img src={propopadLogoFull} alt="Propopad" className="mx-auto mb-6 h-20 w-auto opacity-90" />
          <h2 className="font-display text-3xl font-bold text-primary-foreground">
            Join 2,000+ agencies
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Propopad helps marketing agencies create professional proposals that convert. Set up in under 5 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
