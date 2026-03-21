import { useState } from 'react';
import { CheckCircle2, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SignProposalModalProps {
  proposalId: string;
  proposalTitle: string;
  totalInvestment: string;
  validUntil?: string;
  clientName?: string;
  clientContactName?: string;
  clientContactTitle?: string;
  clientEmail?: string;
  brandColor: string;
  agencyName: string;
  onClose: () => void;
  onSigned: (signature: {
    id: string;
    signed_at: string;
    signer_name: string;
    proposal_hash: string;
  }) => void;
}

const CONSENT_TEXT = (title: string, refNumber: string) =>
  `I have read and agree to the terms outlined in this proposal "${title}" (${refNumber}), including the scope of services, investment, timeline, and terms & conditions.`;

export function SignProposalModal({
  proposalId, proposalTitle, totalInvestment, validUntil,
  clientName, clientContactName, clientContactTitle, clientEmail,
  brandColor, agencyName, onClose, onSigned,
}: SignProposalModalProps) {
  const [signerName, setSignerName] = useState(clientContactName || '');
  const [signerTitle, setSignerTitle] = useState(clientContactTitle || '');
  const [signerCompany, setSignerCompany] = useState(clientName || '');
  const [consentChecked, setConsentChecked] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signatureResult, setSignatureResult] = useState<any>(null);

  const canSign = signerName.trim() && signerCompany.trim() && consentChecked;

  // Extract ref number from title (rough)
  const refNumber = proposalTitle;
  const consentText = CONSENT_TEXT(proposalTitle, refNumber);

  const handleSign = async () => {
    if (!canSign) return;
    setSigning(true);
    try {
      const { data, error } = await supabase.functions.invoke('sign-proposal', {
        body: {
          proposalId,
          signerName: signerName.trim(),
          signerTitle: signerTitle.trim() || null,
          signerCompany: signerCompany.trim(),
          signerEmail: clientEmail || null,
          signatureText: signerName.trim(),
          signatureFont: 'Caveat',
          consentText,
          userAgent: navigator.userAgent,
        },
      });

      if (error || !data?.success) {
        toast.error(data?.error || 'Failed to sign proposal');
        setSigning(false);
        return;
      }

      setSigned(true);
      setSignatureResult(data.signature);
      onSigned(data.signature);
    } catch (err) {
      toast.error('Failed to sign proposal');
      setSigning(false);
    }
  };

  const handleClear = () => {
    setSignerName('');
  };

  const signedDate = signatureResult?.signed_at
    ? new Date(signatureResult.signed_at).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      }) + ' at ' + new Date(signatureResult.signed_at).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
      })
    : '';

  if (signed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
        <div
          className="relative w-full max-w-lg rounded-2xl bg-white p-8 md:p-10 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: `${brandColor}15` }}>
              <CheckCircle2 className="h-8 w-8" style={{ color: brandColor }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#2A2118' }}>Proposal Accepted</h2>
            <p className="text-sm mb-1" style={{ color: '#6B6560' }}>
              You have signed "{proposalTitle}"
            </p>
            <p className="text-sm mb-6" style={{ color: '#6B6560' }}>
              on {signedDate}.
            </p>
            <p className="text-sm mb-2" style={{ color: '#8A7F72' }}>
              {agencyName} has been notified and will be in touch shortly.
            </p>
            {clientEmail && (
              <p className="text-sm mb-6" style={{ color: '#8A7F72' }}>
                A confirmation has been sent to {clientEmail}.
              </p>
            )}
            <button
              onClick={onClose}
              className="px-6 py-3 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90"
              style={{ backgroundColor: brandColor }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-8 pt-8 pb-4 border-b border-[#F0EFEC]">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[#F5F4F0] transition-colors">
            <X className="h-5 w-5" style={{ color: '#8A7F72' }} />
          </button>
          <h2 className="text-xl font-bold" style={{ color: '#2A2118' }}>Sign Proposal</h2>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Proposal summary */}
          <div className="rounded-xl p-5" style={{ backgroundColor: '#FAFAF8', border: '1px solid #EEEAE3' }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#8A7F72' }}>
              You are accepting:
            </p>
            <p className="text-sm font-semibold mb-1" style={{ color: '#2A2118' }}>
              "{proposalTitle}"
            </p>
            <p className="text-sm" style={{ color: '#6B6560' }}>
              Total investment: {totalInvestment}
            </p>
            {validUntil && (
              <p className="text-xs mt-1" style={{ color: '#8A7F72' }}>
                Valid until: {validUntil}
              </p>
            )}
          </div>

          {/* Signer fields */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8A7F72' }}>
              Your Signature
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#2A2118' }}>
                  Full name <span style={{ color: brandColor }}>*</span>
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ border: '1px solid #EEEAE3', background: '#FAFAF8', color: '#2A2118' }}
                  onFocus={(e) => (e.target.style.borderColor = brandColor)}
                  onBlur={(e) => (e.target.style.borderColor = '#EEEAE3')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#2A2118' }}>
                  Title / Role
                </label>
                <input
                  type="text"
                  value={signerTitle}
                  onChange={(e) => setSignerTitle(e.target.value)}
                  placeholder="e.g. CTO, Marketing Director"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ border: '1px solid #EEEAE3', background: '#FAFAF8', color: '#2A2118' }}
                  onFocus={(e) => (e.target.style.borderColor = brandColor)}
                  onBlur={(e) => (e.target.style.borderColor = '#EEEAE3')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#2A2118' }}>
                  Company <span style={{ color: brandColor }}>*</span>
                </label>
                <input
                  type="text"
                  value={signerCompany}
                  onChange={(e) => setSignerCompany(e.target.value)}
                  placeholder="Company name"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ border: '1px solid #EEEAE3', background: '#FAFAF8', color: '#2A2118' }}
                  onFocus={(e) => (e.target.style.borderColor = brandColor)}
                  onBlur={(e) => (e.target.style.borderColor = '#EEEAE3')}
                />
              </div>
            </div>
          </div>

          {/* Signature preview */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8A7F72' }}>
              Signature
            </p>
            <div
              className="rounded-xl p-6 flex items-center justify-center min-h-[80px] relative"
              style={{ border: '1px solid #EEEAE3', background: '#FAFAF8' }}
            >
              {signerName.trim() ? (
                <span
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: '32px',
                    color: '#2A2118',
                    lineHeight: 1.2,
                  }}
                >
                  {signerName}
                </span>
              ) : (
                <span className="text-sm italic" style={{ color: '#C8C3BB' }}>
                  Type your name above to generate signature
                </span>
              )}
            </div>
            {signerName.trim() && (
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleClear}
                  className="text-xs font-medium px-3 py-1 rounded-lg hover:bg-[#F5F4F0] transition-colors"
                  style={{ color: '#8A7F72' }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Consent checkbox */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-[#EEEAE3] accent-current"
              style={{ accentColor: brandColor }}
            />
            <span className="text-sm leading-relaxed" style={{ color: '#6B6560' }}>
              {consentText}
            </span>
          </label>
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-white border-t border-[#F0EFEC] px-8 py-5 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium rounded-xl transition-colors hover:bg-[#F5F4F0]"
            style={{ color: '#8A7F72' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSign}
            disabled={!canSign || signing}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: brandColor }}
          >
            {signing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Sign & Accept
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
