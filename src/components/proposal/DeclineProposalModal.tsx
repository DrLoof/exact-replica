import { useState } from 'react';
import { XCircle, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeclineProposalModalProps {
  proposalId: string;
  agencyName: string;
  agencyEmail?: string;
  onClose: () => void;
  onDeclined: () => void;
}

export function DeclineProposalModal({
  proposalId, agencyName, agencyEmail, onClose, onDeclined,
}: DeclineProposalModalProps) {
  const [feedback, setFeedback] = useState('');
  const [declining, setDeclining] = useState(false);

  const handleDecline = async () => {
    setDeclining(true);
    await supabase.from('proposals').update({
      status: 'declined',
      declined_at: new Date().toISOString(),
    }).eq('id', proposalId);

    // Store feedback as an analytics event if provided
    if (feedback.trim()) {
      await supabase.from('proposal_analytics').insert({
        proposal_id: proposalId,
        event_type: 'decline_feedback',
        section_name: feedback.trim(),
        user_agent: navigator.userAgent,
      });
    }

    toast.success('Proposal declined');
    setDeclining(false);
    onDeclined();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[#F5F4F0] transition-colors">
          <X className="h-5 w-5" style={{ color: '#8A7F72' }} />
        </button>

        <h2 className="text-lg font-bold mb-3" style={{ color: '#2A2118' }}>Decline Proposal</h2>
        <p className="text-sm mb-5" style={{ color: '#6B6560' }}>
          Are you sure? If you have questions, reach out to {agencyName}
          {agencyEmail ? ` at ${agencyEmail}` : ''}.
        </p>

        <div className="mb-5">
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#8A7F72' }}>
            Any feedback? (optional)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Let us know why, so we can improve..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
            style={{ border: '1px solid #EEEAE3', background: '#FAFAF8', color: '#2A2118' }}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium rounded-xl transition-colors hover:bg-[#F5F4F0]"
            style={{ color: '#8A7F72' }}
          >
            Cancel
          </button>
          <button
            onClick={handleDecline}
            disabled={declining}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#EF4444' }}
          >
            {declining ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Confirm Decline
          </button>
        </div>
      </div>
    </div>
  );
}
