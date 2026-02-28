import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

export function AIContentNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('ai_notice_dismissed')) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem('ai_notice_dismissed', 'true');
    setVisible(false);
  };

  return (
    <div
      className="flex items-center justify-between gap-3 rounded-lg px-4 py-2.5 mb-4"
      style={{ backgroundColor: '#F5F2EC', borderLeft: '2px solid #BE8E5E' }}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 shrink-0" style={{ color: '#BE8E5E' }} />
        <p className="text-[12px]" style={{ color: '#4A3F32' }}>
          AI-generated content — review and edit before sending to clients.
        </p>
      </div>
      <button
        onClick={dismiss}
        className="text-[12px] font-medium shrink-0 text-muted-foreground hover:text-foreground"
      >
        Got it
      </button>
    </div>
  );
}
