import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SignupGate } from '@/components/onboarding/SignupGate';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, agency, loading } = useAuth();
  const location = useLocation();
  const [showSignupGate, setShowSignupGate] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    // If user has guest data, show signup gate instead of redirecting to login
    const hasGuestData = !!localStorage.getItem('propopad_guest_proposal');
    if (hasGuestData) {
      if (showSignupGate) {
        return (
          <SignupGate
            trigger="navigate"
            onAuthenticated={() => {
              setShowSignupGate(false);
              window.location.reload();
            }}
            onCancel={() => {
              // Go back to guest preview
              window.location.href = '/proposals/preview';
            }}
          />
        );
      }
      // Auto-show the gate
      return (
        <SignupGate
          trigger="navigate"
          onAuthenticated={() => window.location.reload()}
          onCancel={() => { window.location.href = '/proposals/preview'; }}
        />
      );
    }
    return <Navigate to="/login" replace />;
  }

  // Redirect to onboarding if not complete
  if (agency && !agency.onboarding_complete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
