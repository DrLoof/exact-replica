import { useAuth } from '@/hooks/useAuth';
import { Bell, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Header() {
  const { agency } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 px-8 backdrop-blur-sm">
      <div>
        <h2 className="text-sm font-medium text-muted-foreground">{agency?.name || 'My Agency'}</h2>
      </div>
      <div className="flex items-center gap-3">
        <Link
          to="/proposals/new"
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-hover"
        >
          <Plus className="h-4 w-4" />
          New Proposal
        </Link>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand" />
        </button>
      </div>
    </header>
  );
}
