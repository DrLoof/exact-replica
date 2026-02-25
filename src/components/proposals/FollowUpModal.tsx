import { useState } from 'react';
import { X, Send, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface FollowUpModalProps {
  proposal: any;
  agency: any;
  userProfile: any;
  onClose: () => void;
}

function getFollowUpTemplate(proposal: any, agency: any, userProfile: any) {
  const contactFirst = proposal.client?.contact_name?.split(' ')[0] || 'there';
  const userName = userProfile?.full_name || 'Your Team';
  const agencyName = agency?.name || 'Our Agency';
  const proposalTitle = proposal.title || 'our proposal';
  const sentDate = proposal.sent_at
    ? new Date(proposal.sent_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : 'recently';

  if (proposal.status === 'viewed') {
    return {
      subject: `Re: ${proposalTitle}`,
      body: `Hi ${contactFirst},

I noticed you've had a chance to review our proposal — great! I'd love to hear your initial thoughts and answer any questions.

Would sometime this week work for a quick 15-minute call?

Best,
${userName}
${agencyName}`,
    };
  }

  return {
    subject: `Following up: ${proposalTitle}`,
    body: `Hi ${contactFirst},

I wanted to follow up on the proposal I sent on ${sentDate}. I know things get busy — just wanted to make sure it landed and see if you had any questions.

Happy to hop on a quick call if that's easier.

Best,
${userName}
${agencyName}`,
  };
}

export function FollowUpModal({ proposal, agency, userProfile, onClose }: FollowUpModalProps) {
  const template = getFollowUpTemplate(proposal, agency, userProfile);
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const [copied, setCopied] = useState(false);
  const recipientEmail = proposal.client?.contact_email || '';

  const handleCopy = () => {
    const text = `To: ${recipientEmail}\nSubject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Email content copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendViaMailto = () => {
    const mailto = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="font-display text-base font-bold text-foreground">Follow Up</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {proposal.status === 'viewed' ? 'Client has viewed this proposal' : 'No client activity yet'}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* To */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">To</label>
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
              {recipientEmail || <span className="text-muted-foreground italic">No email on file</span>}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-status-success" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
          <button
            onClick={handleSendViaMailto}
            disabled={!recipientEmail}
            className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50 transition-colors"
          >
            <Send className="h-3.5 w-3.5" /> Open in Email Client
          </button>
        </div>
      </div>
    </div>
  );
}
