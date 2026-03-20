import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  hideHeader?: boolean;
}

export function AppShell({ children }: AppShellProps) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={
          isMobile
            ? `fixed left-0 top-0 z-50 h-screen w-[236px] transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : ''
        }
      >
        <Sidebar onClose={isMobile ? () => setSidebarOpen(false) : undefined} />
      </div>

      <div className={`flex flex-1 flex-col ${isMobile ? '' : 'pl-[236px]'}`}>
        {/* Mobile hamburger */}
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-lg bg-background shadow-md border border-border"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
        )}
        <main className={`flex-1 ${isMobile ? 'px-4 py-4' : 'px-8 py-6'}`} style={{ backgroundImage: "url('/images/paper-background.png')", backgroundSize: "cover", backgroundRepeat: "repeat", backgroundAttachment: "fixed" }}>
          <div className="mx-auto max-w-[1200px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
