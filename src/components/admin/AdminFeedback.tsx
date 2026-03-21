import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const ratingEmojis: Record<number, string> = { 1: '😟', 2: '😐', 3: '🙂', 4: '😊', 5: '🤩' };
const statusOptions = ['new', 'read', 'replied', 'resolved'];
const statusColors: Record<string, { bg: string; text: string }> = {
  new: { bg: '#E3F2FD', text: '#1565C0' },
  read: { bg: '#FFF8E1', text: '#F57F17' },
  replied: { bg: '#E8F5E9', text: '#2E7D32' },
  resolved: { bg: '#EEEAE3', text: '#8A7F72' },
};

interface FeedbackItem {
  id: string;
  rating: number | null;
  message: string | null;
  can_contact: boolean;
  page_url: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  agency_id: string | null;
  user_id: string | null;
}

export function AdminFeedback({ feedback, onRefresh }: { feedback: FeedbackItem[]; onRefresh: () => void }) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const unread = feedback.filter(f => f.status === 'new').length;
  const avgRating = feedback.filter(f => f.rating).length > 0
    ? (feedback.reduce((s, f) => s + (f.rating || 0), 0) / feedback.filter(f => f.rating).length).toFixed(1)
    : '—';

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('feedback' as any).update({ status } as any).eq('id', id);
    if (error) toast.error('Failed to update status');
    else onRefresh();
  };

  const saveNotes = async (id: string) => {
    const { error } = await supabase.from('feedback' as any).update({ admin_notes: notes[id] || '' } as any).eq('id', id);
    if (error) toast.error('Failed to save notes');
    else toast.success('Notes saved');
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex gap-6 text-sm">
        <span className="text-ink-muted">{feedback.length} total</span>
        <span style={{ color: '#1565C0' }}>{unread} unread</span>
        <span className="text-ink-muted">Avg rating: {avgRating}/5</span>
      </div>

      {/* List */}
      {feedback.length === 0 ? (
        <div className="rounded-xl bg-paper p-8 shadow-card text-center text-ink-faint text-sm">
          No feedback yet
        </div>
      ) : (
        <div className="space-y-3">
          {feedback.map((f) => {
            const sc = statusColors[f.status] || statusColors.new;
            return (
              <div key={f.id} className="rounded-xl bg-paper p-5 shadow-card">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    {f.rating && (
                      <span className="text-xl">{ratingEmojis[f.rating] || '🙂'}</span>
                    )}
                    <span className="text-sm font-semibold text-ink">{f.rating || '—'}/5</span>
                    <span className="text-xs text-ink-faint">
                      {formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={f.status}
                      onChange={(e) => updateStatus(f.id, e.target.value)}
                      className="text-[10px] font-semibold rounded-full px-2 py-0.5 border-0 cursor-pointer"
                      style={{ backgroundColor: sc.bg, color: sc.text }}
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {f.message && (
                  <p className="text-sm text-ink mb-3">"{f.message}"</p>
                )}

                <div className="flex gap-4 text-[11px] text-ink-faint mb-3">
                  {f.page_url && <span>Page: {f.page_url}</span>}
                  <span>Can contact: {f.can_contact ? 'Yes' : 'No'}</span>
                </div>

                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Admin notes..."
                    defaultValue={f.admin_notes || ''}
                    onChange={(e) => setNotes(prev => ({ ...prev, [f.id]: e.target.value }))}
                    className="flex-1 text-xs rounded-lg border px-3 py-1.5 bg-transparent text-ink"
                    style={{ borderColor: '#EEEAE3' }}
                  />
                  <button
                    onClick={() => saveNotes(f.id)}
                    className="text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-ink text-ivory hover:bg-ink-soft transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
