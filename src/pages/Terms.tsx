import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import propopadLogo from '@/assets/logo_propopad_small.svg';

export default function Terms() {
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[680px] px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden">
              <img src={propopadLogo} alt="Propopad" className="h-9 w-9" />
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
          <h1 className="font-display text-[28px] font-bold text-foreground">Terms of Service</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Last updated: February 2026</p>
          <div className="mt-4 h-px bg-border" />

          <div className="mt-6 space-y-0 legal-content">
            <Section title="1. About Propopad">
              <p>Propopad is a proposal creation platform for service businesses, operated by Propopad, based in Sweden.</p>
              <p>Contact: hello@propopad.com</p>
            </Section>

            <Section title="2. Agreement">
              <p>By creating an account, you agree to these Terms and our Privacy Policy. If you represent a business, you confirm you have authority to agree on its behalf. You must be at least 18 years old.</p>
            </Section>

            <Section title="3. The Service">
              <p>Propopad lets you create, customize, send, and track business proposals. This includes creating proposals using pre-built service templates and AI-generated content, sending proposals via shareable web links and PDF export, tracking client engagement with your proposals, managing your services, pricing, and client information, and scanning your own website to set up your account.</p>
            </Section>

            <Section title="4. Your Account">
              <p>You're responsible for keeping your login credentials secure and for all activity under your account. Provide accurate information. One account per business. We may suspend accounts that appear fraudulent or violate these Terms.</p>
            </Section>

            <Section title="5. Your Content & Responsibility">
              <p>You own all content you create in Propopad — proposals, services, client data, branding. We don't claim ownership.</p>
              <p>You grant us a limited license to store, process, display, and transmit your content solely to provide the Service. This license ends when you delete your content or account.</p>
              <p>You are responsible for the accuracy of pricing, service descriptions, and terms you present to clients. You are responsible for having proper permission to use testimonials, client logos, and third-party content. You are responsible for reviewing and editing all AI-generated content before sending.</p>
              <p>Propopad provides templates, default terms, and AI-generated text as starting points. These are not legal, financial, or professional advice.</p>
            </Section>

            <Section title="6. AI-Generated Content">
              <p>Parts of the Service use AI to generate proposal content including summaries, titles, descriptions, and projections. AI-generated content is a suggestion that you should always review before sending. It may contain inaccuracies. It becomes your responsibility once you send a proposal containing it. It does not constitute professional advice of any kind.</p>
            </Section>

            <Section title="7. Website Scanning">
              <p>When you choose to scan your website during setup, we read only publicly accessible content from the URL you provide. We extract business information, services, testimonials, and branding. Extracted content is stored in your account only. You review and approve all extracted content before use. You confirm you have the right to use any testimonials or third-party content found. We respect robots.txt and do not scan pages behind authentication.</p>
            </Section>

            <Section title="8. Acceptable Use">
              <p>Do not use Propopad to create fraudulent, deceptive, or illegal proposals, include defamatory or unlawful content, attempt to access other users' data, reverse-engineer or interfere with the Service, create multiple free accounts to circumvent limits, or resell or white-label the Service without permission.</p>
            </Section>

            <Section title="9. Subscription & Payment">
              <p>Free plan is subject to usage limits shown on our pricing page. We may modify free plan limits with 30 days' notice.</p>
              <p>Paid plans are billed monthly via Stripe. Cancel anytime — access continues through the current billing period. No refunds for partial periods. We may change pricing with 30 days' email notice, effective at the next billing cycle.</p>
            </Section>

            <Section title="10. Proposal Links & Analytics">
              <p>Proposals shared via link are accessible to anyone with the link. We track engagement (views, time spent per section) to provide you with analytics. On free plans, a "Powered by Propopad" notice appears on proposals.</p>
            </Section>

            <Section title="11. Limitation of Liability">
              <p>To the maximum extent permitted by law, our total liability is limited to fees you've paid us in the 12 months before the claim. We are not liable for indirect, incidental, or consequential damages, lost deals, lost revenue, or business interruption. We are not liable for the accuracy of AI content, scan results, or analytics. We are not liable for actions your clients take based on your proposals.</p>
            </Section>

            <Section title="12. Disclaimer">
              <p>The Service is provided "as is" without warranties of any kind. Templates, AI content, and default terms are starting points, not professional advice.</p>
            </Section>

            <Section title="13. Account Deletion">
              <p>You can delete your account from Settings at any time. We delete your data within 30 days. Public proposal links become inactive upon deletion.</p>
            </Section>

            <Section title="14. Governing Law">
              <p>These Terms are governed by Swedish law. Nothing in these Terms limits your rights under mandatory consumer protection laws in your jurisdiction.</p>
            </Section>

            <Section title="15. Changes">
              <p>We may update these Terms with 30 days' email notice. Continued use after the effective date means acceptance.</p>
            </Section>

            <Section title="16. Contact">
              <p>Questions: hello@propopad.com</p>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8 first:mt-0">
      <h2 className="text-[16px] font-semibold text-foreground mb-3">{title}</h2>
      <div className="space-y-4 text-[14px] leading-relaxed" style={{ color: '#4A3F32' }}>
        {children}
      </div>
    </div>
  );
}
