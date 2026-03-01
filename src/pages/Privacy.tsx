import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import propopadLogo from '@/assets/logo_propopad_small.svg';

export default function Privacy() {
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[680px] px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand">
              <img src={propopadLogo} alt="Propopad" className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">Propopad</span>
          </Link>
          {session && (
            <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">
              ← Back to app
            </Link>
          )}
        </div>

        {/* Content card */}
        <div className="rounded-2xl bg-card p-8 shadow-card">
          <h1 className="font-display text-[28px] font-bold text-foreground">Privacy Policy</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Last updated: February 2026</p>
          <div className="mt-4 h-px bg-border" />

          <div className="mt-6 space-y-0 legal-content">
            <Section title="1. Who We Are">
              <p>Propopad is operated from Sweden by Propopad.</p>
              <p>Privacy contact: privacy@propopad.com</p>
              <p>This policy explains how we handle data for users worldwide, with specific sections for EU/EEA users (GDPR) and California users (CCPA).</p>
            </Section>

            <Section title="2. Data We Collect">
              <p><strong>Account information:</strong> Email, name, and password (hashed) when you sign up.</p>
              <p><strong>Business information:</strong> Agency name, website, logo, brand colors, contact details, and business settings you provide.</p>
              <p><strong>Proposal content:</strong> Everything in your proposals — service descriptions, pricing, client information, testimonials, terms, timelines.</p>
              <p><strong>Client information:</strong> Names, emails, companies, and notes about your clients that you enter.</p>
              <p><strong>Website scan data:</strong> When you choose to scan your website, we extract publicly available business information, services, testimonials, and branding from the URL you provide. Raw scan data is deleted after 90 days; extracted results remain in your account.</p>
              <p><strong>Analytics data:</strong> When your clients view proposals, we record page views, sections viewed, time spent, device type, and IP address. IP addresses are anonymized after 30 days.</p>
              <p><strong>Usage data:</strong> How you use Propopad — pages visited, features used, timestamps. Collected to improve the Service.</p>
              <p><strong>Payment data:</strong> Processed entirely by Stripe. We never see or store card numbers.</p>
              <p><strong>Cookies:</strong> Session cookies for authentication (essential), preference cookies for settings (optional), analytics cookies for service improvement (optional). No advertising or tracking cookies.</p>
            </Section>

            <Section title="3. How We Use Your Data">
              <p>We use your data to provide and maintain the Service, generate AI content for your proposals, show you proposal engagement analytics, process your payments, send transactional emails (proposal viewed, accepted, etc.), and improve the Service.</p>
              <p>We do NOT sell your data. We do NOT use your content to train AI models. We do NOT share your data with advertisers.</p>
            </Section>

            <Section title="4. Third-Party Data">
              <p>You may enter personal data of others (clients, testimonial subjects). You are responsible for having appropriate permission to store and use this data. For testimonials detected during website scanning, you explicitly approve each one before it is used in proposals.</p>
            </Section>

            <Section title="5. Service Providers">
              <p>We share data with these providers to operate the Service: Supabase (database and authentication, EU), Anthropic (AI content generation, US), Stripe (payment processing, US), and our website scanning provider (US). For transfers to the US, appropriate safeguards are in place.</p>
            </Section>

            <Section title="6. Data Retention">
              <p>Account data, proposals, and client information are kept until you delete them or your account, then deleted within 30 days. Proposal analytics are kept 12 months after proposal expiry. Raw website scan data is kept 90 days. Payment records are kept 7 years (Swedish accounting law). Server logs are kept 90 days. Backups containing deleted data are purged within 90 days.</p>
            </Section>

            <Section title="7. Your Rights">
              <p>All users can access and export all their data from Settings, correct inaccurate data in-app, delete specific data or their entire account, and contact us at privacy@propopad.com.</p>
              <p>EU/EEA users additionally have GDPR rights to restrict processing, data portability, object to processing based on legitimate interest, withdraw consent for website scanning, and lodge a complaint with the Swedish Authority for Privacy Protection (IMY) or your local supervisory authority.</p>
              <p>California users have CCPA rights to know what personal information is collected, delete personal information, opt out of sale of personal information (we don't sell data), and non-discrimination for exercising privacy rights.</p>
              <p>We respond to all requests within 30 days.</p>
            </Section>

            <Section title="8. Security">
              <p>We protect your data with encryption in transit and at rest, row-level security isolating each account's data, regular security monitoring, and access controls limiting employee access to customer data.</p>
            </Section>

            <Section title="9. Cookies" id="cookies">
              <p>We use essential cookies for authentication (cannot be disabled) and optional analytics cookies to improve the Service (can be disabled). We do NOT use advertising or tracking cookies.</p>
            </Section>

            <Section title="10. Children">
              <p>Propopad is for users 18 and older. We do not knowingly collect data from minors.</p>
            </Section>

            <Section title="11. Changes">
              <p>Material changes are communicated via email 30 days in advance.</p>
            </Section>

            <Section title="12. Contact">
              <p>Privacy questions: privacy@propopad.com</p>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <div className="mt-8 first:mt-0" id={id}>
      <h2 className="text-[16px] font-semibold text-foreground mb-3">{title}</h2>
      <div className="space-y-4 text-[14px] leading-relaxed" style={{ color: '#4A3F32' }}>
        {children}
      </div>
    </div>
  );
}
