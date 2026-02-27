import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useLocation } from 'react-router-dom';

interface AppShellProps {
  children: React.ReactNode;
  hideHeader?: boolean;
}

export function AppShell({ children, hideHeader }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col pl-60">
        {!hideHeader && <Header />}
        <main className="flex-1 px-8 py-6">
          <div className="mx-auto max-w-[1200px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
