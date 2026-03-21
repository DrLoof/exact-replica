import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const emojis = [
  { emoji: '😟', label: 'Bad', value: 1 },
  { emoji: '😐', label: 'Meh', value: 2 },
  { emoji: '🙂', label: 'OK', value: 3 },
  { emoji: '😊', label: 'Good', value: 4 },
  { emoji: '🤩', label: 'Amazing', value: 5 },
];

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const { user, userProfile, agency } = useAuth();
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [canContact, setCanContact] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating && !message.trim()) {
      toast.error('Please select a rating or write a message');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('feedback' as any).insert({
        agency_id: agency?.id || null,
        user_id: user?.id || null,
        rating,
        message: message.trim() || null,
        can_contact: canContact,
        page_url: window.location.pathname,
        user_agent: navigator.userAgent,
      } as any);
      if (error) throw error;
      toast.success('Thank you for your feedback!');
      setRating(null);
      setMessage('');
      setCanContact(false);
      onOpenChange(false);
    } catch (e: any) {
      toast.error('Failed to send feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-ink">Share your feedback</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          <div>
            <p className="text-sm text-ink-muted mb-3">How's your experience with Propopad?</p>
            <div className="flex gap-2 justify-center">
              {emojis.map((e) => (
                <button
                  key={e.value}
                  onClick={() => setRating(e.value)}
                  className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all ${
                    rating === e.value
                      ? 'bg-parchment-soft scale-110 shadow-card'
                      : 'hover:bg-parchment-soft/50'
                  }`}
                >
                  <span className="text-2xl">{e.emoji}</span>
                  <span className="text-[10px] text-ink-faint">{e.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-ink-muted mb-2">What could we improve?</p>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what's on your mind..."
              rows={4}
              className="resize-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={canContact} onCheckedChange={(v) => setCanContact(!!v)} />
            <span className="text-sm text-ink-muted">You can contact me about this</span>
          </label>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Sending...' : 'Send feedback'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
