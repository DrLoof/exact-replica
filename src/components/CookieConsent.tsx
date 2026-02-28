import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('cookie_consent')) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const accept = (level: 'all' | 'essential') => {
    localStorage.setItem('cookie_consent', level);
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto mx-auto w-full max-w-[520px] rounded-t-xl bg-card px-5 py-4 shadow-card-hover">
        <p className="text-[13px] leading-relaxed" style={{ color: '#4A3F32' }}>
          We use essential cookies for the app to work and optional cookies to improve your experience. No advertising cookies.{' '}
          <Link to="/privacy#cookies" className="font-medium underline text-muted-foreground hover:text-foreground">
            Learn more
          </Link>
        </p>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => accept('essential')}
            className="rounded-[8px] border border-border px-4 py-2 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Essential only
          </button>
          <button
            onClick={() => accept('all')}
            className="rounded-[8px] bg-foreground px-4 py-2 text-[12px] font-semibold text-card transition-colors"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
