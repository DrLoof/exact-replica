import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Step2GroupsProps {
  selectedGroups: string[];
  onChange: (groups: string[]) => void;
  moduleCounts?: Record<string, number>;
}

interface ServiceGroup {
  id: string;
  name: string;
  description: string;
  icon: string;
  display_order: number;
}

export function Step2Groups({ selectedGroups, onChange, moduleCounts = {} }: Step2GroupsProps) {
  const [groups, setGroups] = useState<ServiceGroup[]>([]);

  useEffect(() => {
    supabase
      .from('service_groups')
      .select('*')
      .order('display_order')
      .then(({ data }) => {
        if (data) setGroups(data);
      });
  }, []);

  const toggle = (id: string) => {
    onChange(
      selectedGroups.includes(id)
        ? selectedGroups.filter((g) => g !== id)
        : [...selectedGroups, id]
    );
  };

  const selectAll = () => onChange(groups.map((g) => g.id));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">What type of services does your agency offer?</h1>
          <p className="mt-2 text-sm text-muted-foreground">Select the areas you work in. We'll use this to set up your service modules.</p>
        </div>
        <button onClick={selectAll} className="text-sm text-brand hover:text-brand-hover font-medium">
          Select All
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => {
          const isSelected = selectedGroups.includes(group.id);
          const IconComp = (Icons as any)[group.icon] || Icons.Layers;
          const count = moduleCounts[group.name] || 0;

          return (
            <button
              key={group.id}
              onClick={() => toggle(group.id)}
              className={cn(
                'relative flex flex-col items-start rounded-xl border-2 p-5 text-left transition-all',
                isSelected
                  ? 'border-brand bg-accent shadow-sm'
                  : 'border-border bg-card hover:border-muted-foreground/30 hover:shadow-sm'
              )}
            >
              {isSelected && (
                <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand">
                  <Check className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              )}
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                isSelected ? 'bg-brand/10' : 'bg-muted'
              )}>
                <IconComp className={cn('h-5 w-5', isSelected ? 'text-brand' : 'text-muted-foreground')} />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{group.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{group.description}</p>
              <span className="mt-3 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {count} services
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {selectedGroups.length} service area{selectedGroups.length !== 1 ? 's' : ''} selected
      </p>
    </div>
  );
}
