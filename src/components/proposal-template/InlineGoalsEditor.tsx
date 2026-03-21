import React, { useState, useMemo } from 'react';
import { Check, Plus } from 'lucide-react';
import { goalOptionsList, type GoalOption, type SelectedGoal } from '@/components/proposal-new/ClientZone';

interface InlineGoalsEditorProps {
  goals: SelectedGoal[];
  serviceNames: string[];
  onSave: (goals: SelectedGoal[]) => void;
  onCancel: () => void;
}

export function InlineGoalsEditor({ goals, serviceNames, onSave, onCancel }: InlineGoalsEditorProps) {
  // Initialize from existing goals or auto-suggest based on services
  const autoSuggested = useMemo(() => {
    if (goals.length > 0) return goals;
    // Auto-suggest top 3 based on service names
    const scored = goalOptionsList
      .filter(g => g.id !== 'other')
      .map(g => ({
        ...g,
        score: g.relatedServices.filter(rs =>
          serviceNames.some(sn => sn.toLowerCase().includes(rs.toLowerCase()) || rs.toLowerCase().includes(sn.toLowerCase()))
        ).length,
      }))
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).filter(s => s.score > 0).map(g => ({
      id: g.id, label: g.label, kpi: g.defaultKpi,
    }));
  }, [goals, serviceNames]);

  const [selected, setSelected] = useState<Map<string, { label: string; kpi: string }>>(
    () => new Map(autoSuggested.map(g => [g.id, { label: g.label, kpi: g.kpi }]))
  );
  const [customLabel, setCustomLabel] = useState('');

  const toggle = (goal: GoalOption) => {
    setSelected(prev => {
      const next = new Map(prev);
      if (next.has(goal.id)) {
        next.delete(goal.id);
      } else if (next.size < 5) {
        next.set(goal.id, { label: goal.label, kpi: goal.defaultKpi });
      }
      return next;
    });
  };

  const updateKpi = (id: string, kpi: string) => {
    setSelected(prev => {
      const next = new Map(prev);
      const existing = next.get(id);
      if (existing) next.set(id, { ...existing, kpi });
      return next;
    });
  };

  const handleDone = () => {
    const result: SelectedGoal[] = Array.from(selected.entries()).map(([id, data]) => ({
      id, label: data.label, kpi: data.kpi,
    }));
    onSave(result);
  };

  return (
    <div
      className="rounded-xl p-6 print:hidden"
      style={{ backgroundColor: 'white', border: '1px solid #EEEAE3', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="uppercase tracking-[0.08em] font-semibold" style={{ fontSize: '11px', color: '#B8B0A5' }}>
          Select Goals
        </span>
        <button
          onClick={handleDone}
          className="flex items-center gap-1.5 font-medium transition-colors hover:opacity-70"
          style={{ fontSize: '13px', color: '#2A2118' }}
        >
          Done <Check className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mb-4" style={{ fontSize: '12px', color: '#8A7F72' }}>
        Choose 2–5 goals. KPI targets are auto-suggested.
      </p>
      <div className="space-y-1.5">
        {goalOptionsList.filter(g => g.id !== 'other').map(goal => {
          const isChecked = selected.has(goal.id);
          const disabled = !isChecked && selected.size >= 5;
          return (
            <div key={goal.id} className="flex items-center gap-3 py-1.5">
              <button
                onClick={() => !disabled && toggle(goal)}
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors"
                style={{
                  borderColor: isChecked ? '#2A2118' : '#D5D0C8',
                  backgroundColor: isChecked ? '#2A2118' : 'transparent',
                  opacity: disabled ? 0.4 : 1,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              >
                {isChecked && <Check className="h-3 w-3 text-white" />}
              </button>
              <span
                className="flex-1 cursor-pointer select-none"
                style={{ fontSize: '14px', color: '#2A2118', opacity: disabled ? 0.4 : 1 }}
                onClick={() => !disabled && toggle(goal)}
              >
                {goal.label}
              </span>
              {isChecked && (
                <input
                  type="text"
                  value={selected.get(goal.id)?.kpi || ''}
                  onChange={(e) => updateKpi(goal.id, e.target.value)}
                  placeholder={goal.defaultKpi}
                  className="text-right font-semibold outline-none focus:ring-1 focus:ring-[#EEEAE3]"
                  style={{
                    width: '80px', fontSize: '13px', color: '#2A2118',
                    border: '1px solid #EEEAE3', borderRadius: '8px',
                    padding: '4px 12px',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface AddGoalsPromptProps {
  onClick: () => void;
}

export function AddGoalsPrompt({ onClick }: AddGoalsPromptProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-center transition-colors cursor-pointer print:hidden"
      style={{
        border: '2px dashed #EEEAE3',
        borderRadius: '16px',
        padding: '24px 32px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#DDD8D0';
        e.currentTarget.style.backgroundColor = '#FAF9F6';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#EEEAE3';
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <span className="block font-semibold" style={{ fontSize: '14px', color: '#2A2118' }}>
        <Plus className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
        Add goals to show projected outcomes
      </span>
      <span className="block mt-1" style={{ fontSize: '12px', color: '#8A7F72' }}>
        Strengthen your proposal with measurable KPI targets
      </span>
    </button>
  );
}
