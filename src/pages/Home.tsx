import { Link, Navigate } from 'react-router-dom';
import propopadLogo from '@/assets/logo_propopad_small.svg';
import { ArrowRight, Zap, Eye, FileText, Shield, BarChart3, Palette, Clock, Layers, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';

const features = [
  { icon: Zap, title: 'AI-Powered Setup', desc: 'Scan your website. We auto-detect your brand, services, testimonials, and more.' },
  { icon: Palette, title: 'Branded Templates', desc: 'Your colors, your logo, your voice — every proposal looks like you built it from scratch.' },
  { icon: FileText, title: 'Service Bundles', desc: 'Package your services into compelling bundles with automatic discount calculations.' },
  { icon: Eye, title: 'Client Tracking', desc: 'Know when your client opens, reads, and revisits your proposal in real time.' },
  { icon: BarChart3, title: 'Smart Pricing', desc: 'Fixed, monthly, or hourly — mix pricing models and let the math handle itself.' },
  { icon: Shield, title: 'Legal Built-In', desc: 'Professional terms, payment milestones, and e-signatures included from day one.' },
];

export default function Home() {
  const { session, loading } = useAuth();

  if (!loading && session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 md:px-12 lg:px-20">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink">
            <img src={propopadLogo} alt="Propopad" className="h-5 w-5 invert" />
          </div>
          <span className="font-display text-lg font-bold text-foreground">Propopad</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-block"
          >
            Sign in
          </Link>
          <Link
            to="/onboarding"
            className="rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-ink-soft"
          >
            Try for free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-20 pt-16 text-center md:pt-24 lg:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="label-overline text-brass">For agencies that mean business</span>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
            Proposals that<br />
            <span className="text-brass">win clients</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Create stunning, branded proposals in under 3 minutes. 
            Scan your website, pick your services, send — done.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-8 py-4 text-[16px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              style={{ boxShadow: '0 2px 8px rgba(42,33,24,0.15)' }}
            >
              Try for free — no signup needed
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Set up your agency profile in 3 minutes. Sign up when you're ready to send.
          </p>
        </motion.div>
      </section>

      {/* Social proof strip */}
      <section className="border-y border-border bg-card py-8">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 px-6 md:gap-16">
          <div className="flex items-center gap-2.5 text-center">
            <Clock className="h-5 w-5 text-brass shrink-0" />
            <div>
              <p className="font-display text-2xl font-bold text-foreground">3 min</p>
              <p className="text-xs text-muted-foreground">Average setup time</p>
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex items-center gap-2.5 text-center">
            <Layers className="h-5 w-5 text-brass shrink-0" />
            <div>
              <p className="font-display text-2xl font-bold text-foreground">50+</p>
              <p className="text-xs text-muted-foreground">Pre-built services</p>
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex items-center gap-2.5 text-center">
            <Sparkles className="h-5 w-5 text-brass shrink-0" />
            <div>
              <p className="font-display text-2xl font-bold text-foreground">AI</p>
              <p className="text-xs text-muted-foreground">Powered by smart scraping</p>
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-[13px] font-medium text-muted-foreground">
          Trusted by 50+ marketing agencies
        </p>
      </section>

      {/* Features grid */}
      <section className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="text-center">
          <span className="label-overline text-brass">Everything you need</span>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground">
            From scan to send in minutes
          </h2>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                <f.icon className="h-5 w-5 text-brass" />
              </div>
              <h3 className="font-display text-base font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-card py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center">
            <span className="label-overline text-brass">How it works</span>
            <h2 className="mt-3 font-display text-3xl font-bold text-foreground">
              Three steps. Zero friction.
            </h2>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              { step: '01', title: 'Scan your website', desc: 'Enter your URL. We detect your brand, services, colors, testimonials, and contact info.' },
              { step: '02', title: 'Review & customize', desc: 'Toggle services on or off, add bundles, adjust pricing — all in one clean review screen.' },
              { step: '03', title: 'Send your proposal', desc: 'Generate a shareable link with tracking. Know exactly when they open it.' },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.12 }}
                className="text-center md:text-left"
              >
                <span className="font-display text-3xl font-bold text-border">{s.step}</span>
                <h3 className="mt-2 font-display text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-8 py-4 text-[16px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              style={{ boxShadow: '0 2px 8px rgba(42,33,24,0.15)' }}
            >
              Start now — it's free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink">
              <img src={propopadLogo} alt="" className="h-3.5 w-3.5 invert" />
            </div>
            <span className="font-display text-sm font-bold text-foreground">Propopad</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/login" className="hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
