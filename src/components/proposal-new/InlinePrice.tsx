import { useState } from 'react';

interface InlinePriceProps {
  value: number;
  onChange: (v: number) => void;
  currencySymbol: string;
  suffix: string;
  isOverridden: boolean;
  onReset: () => void;
}

export function InlinePrice({ value, onChange, currencySymbol, suffix, isOverridden, onReset }: InlinePriceProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          const num = parseFloat(draft);
          if (!isNaN(num) && num >= 0) onChange(num);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') setEditing(false);
        }}
        className="w-20 rounded border border-foreground/30 bg-background px-1.5 py-0.5 text-right text-sm tabular-nums text-foreground focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <span
      className="relative cursor-pointer text-[14px] font-semibold tabular-nums text-foreground hover:text-foreground/70"
      onClick={(e) => {
        e.stopPropagation();
        setDraft(String(value));
        setEditing(true);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (isOverridden) onReset();
      }}
      title={isOverridden ? 'Double-click to reset to default' : 'Click to edit price'}
    >
      {isOverridden && (
        <span className="absolute -left-2.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-status-warning" />
      )}
      {currencySymbol}{value.toLocaleString()}{suffix}
    </span>
  );
}
