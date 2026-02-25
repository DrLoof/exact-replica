import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Signup() {
  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="flex flex-1 flex-col justify-center px-8 py-12 sm:px-16 lg:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">Propopad</span>
          </div>

          <h1 className="font-display text-2xl font-bold text-foreground">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Start creating winning proposals in minutes</p>

          <form className="mt-8 space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Full name</label>
              <input
                type="text"
                placeholder="John Doe"
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Work email</label>
              <input
                type="email"
                placeholder="you@agency.com"
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
              <input
                type="password"
                placeholder="At least 8 characters"
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <Link
              to="/onboarding"
              className="block w-full rounded-lg bg-brand py-2.5 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-hover"
            >
              Create account
            </Link>
            <p className="text-center text-xs text-muted-foreground">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand hover:text-brand-hover">Sign in</Link>
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="hidden flex-1 items-center justify-center bg-brand lg:flex">
        <div className="max-w-md px-12 text-center">
          <Sparkles className="mx-auto mb-6 h-12 w-12 text-primary-foreground/80" />
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
