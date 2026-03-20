import React, { type ReactNode, useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Plus, X, ChevronDown } from "lucide-react";
import { useBrand } from "./BrandTheme";
import { useTemplate } from "./TemplateProvider";
import { EditableText } from "./EditableText";

const GENERIC_RESPONSIBILITIES = [
  'Provide timely feedback within agreed review windows',
  'Designate a single point of contact for approvals',
  'Provide brand assets and guidelines',
  'Provide platform/tool access credentials',
  'Share relevant business data and insights',
];

const GENERIC_OUT_OF_SCOPE = [
  'Services not explicitly listed in the deliverables',
  'Third-party tool subscription or licensing costs',
  'Content creation beyond what is specified',
  'Translation or localization',
  'Training beyond what is included in deliverables',
];

interface ServiceCardProps {
  icon: ReactNode;
  name: string;
  price: string;
  pricingModel?: "fixed" | "monthly" | "hourly" | "per_unit";
  description: string;
  deliverables: string[];
  clientResponsibilities?: string[];
  outOfScope?: string[];
  moduleDefaultResponsibilities?: string[];
  moduleDefaultOutOfScope?: string[];
  isAddon?: boolean;
  delay?: number;
  onNameEdit?: (value: string) => void;
  onDescriptionEdit?: (value: string) => void;
  onDeliverablesEdit?: (deliverables: string[]) => void;
  onClientResponsibilitiesEdit?: (items: string[]) => void;
  onOutOfScopeEdit?: (items: string[]) => void;
  onRemove?: () => void;
}

const MODEL_LABELS: Record<string, string> = {
  fixed: "",
  monthly: "/mo",
  hourly: "/hr",
  per_unit: "/unit",
};

const MAX_COLLAPSED = 3;

function CollapsibleList({
  items,
  renderItem,
}: {
  items: string[];
  renderItem: (item: string, idx: number) => React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, MAX_COLLAPSED);
  const hasMore = items.length > MAX_COLLAPSED;

  return (
    <>
      <ul className="space-y-1.5">
        {visible.map((item, idx) => renderItem(item, idx))}
      </ul>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-1.5 text-[11px] font-medium opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: "inherit" }}
        >
          <ChevronDown
            className="h-3 w-3 transition-transform"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          />
          {expanded ? "Show less" : `+${items.length - MAX_COLLAPSED} more`}
        </button>
      )}
    </>
  );
}

function ListAddButton({
  isAdding, setIsAdding, inputValue, setInputValue,
  onAdd, currentItems, label, suggestions,
}: {
  isAdding: boolean; setIsAdding: (v: boolean) => void;
  inputValue: string; setInputValue: (v: string) => void;
  onAdd: (items: string[]) => void; currentItems: string[];
  label: string; suggestions: string[];
}) {
  const availableSuggestions = suggestions.filter(s => !currentItems.includes(s));
  const [showSuggestions, setShowSuggestions] = useState(false);
  const sugRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sugRef.current && !sugRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    if (showSuggestions) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSuggestions]);

  return (
    <div className="mt-2 print:hidden relative" ref={sugRef}>
      {isAdding ? (
        <div>
          <div className="flex items-center gap-2">
            <input
              type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && inputValue.trim()) { onAdd([...currentItems, inputValue.trim()]); setInputValue(""); setIsAdding(false); setShowSuggestions(false); }
                if (e.key === 'Escape') { setIsAdding(false); setInputValue(''); setShowSuggestions(false); }
              }}
              onFocus={() => { if (availableSuggestions.length > 0) setShowSuggestions(true); }}
              placeholder={`Add ${label.toLowerCase()}...`} autoFocus
              className="flex-1 border border-[#E0E0E0] rounded-lg px-3 py-1.5 text-[#555] outline-none focus:border-[#BBB]"
              style={{ fontSize: "12px" }}
            />
            <button onClick={() => { if (inputValue.trim()) { onAdd([...currentItems, inputValue.trim()]); setInputValue(""); setIsAdding(false); setShowSuggestions(false); } }} className="text-[#888] hover:text-[#555] text-xs font-medium">Add</button>
            <button onClick={() => { setIsAdding(false); setInputValue(''); setShowSuggestions(false); }} className="text-[#CCC] hover:text-[#888]">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {showSuggestions && availableSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 z-20 bg-white border border-[#E0E0E0] rounded-lg shadow-lg max-h-40 overflow-y-auto">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-[#AAA] uppercase tracking-wider">Suggestions</div>
              {availableSuggestions.slice(0, 8).map((sug, i) => (
                <button
                  key={i}
                  onClick={() => { onAdd([...currentItems, sug]); setShowSuggestions(false); }}
                  className="w-full text-left px-3 py-1.5 text-[#666] hover:bg-[#F5F5F5] transition-colors"
                  style={{ fontSize: "12px" }}
                >
                  {sug}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button onClick={() => setIsAdding(true)} className="flex items-center gap-1.5 text-[#CCC] hover:text-[#888] transition-colors" style={{ fontSize: "11px" }}>
          <Plus className="h-3 w-3" /> Add {label.toLowerCase()}
        </button>
      )}
    </div>
  );
}

export function ServiceCard({
  icon, name, price, pricingModel, description, deliverables,
  clientResponsibilities, outOfScope,
  moduleDefaultResponsibilities, moduleDefaultOutOfScope,
  isAddon = false, delay = 0,
  onNameEdit, onDescriptionEdit, onDeliverablesEdit,
  onClientResponsibilitiesEdit, onOutOfScopeEdit,
  onRemove,
}: ServiceCardProps) {
  const brand = useBrand();
  const template = useTemplate();
  const isModern = template.id === 'modern';
  const isElegant = template.id === 'elegant';
  const isSoft = template.id === 'soft';
  const accent = template.colors.primaryAccent;
  const secondary = template.colors.secondaryAccent;
  const dark = template.colors.primaryDark;
  const suffix = pricingModel ? MODEL_LABELS[pricingModel] || "" : "";
  const [newItem, setNewItem] = useState("");
  const [adding, setAdding] = useState(false);
  const [addingResp, setAddingResp] = useState(false);
  const [newResp, setNewResp] = useState("");
  const [addingOos, setAddingOos] = useState(false);
  const [newOos, setNewOos] = useState("");
  const editable = !!onDeliverablesEdit;
  const editableResp = !!onClientResponsibilitiesEdit;
  const editableOos = !!onOutOfScopeEdit;

  const hasResponsibilities = clientResponsibilities && clientResponsibilities.length > 0;
  const hasOutOfScope = outOfScope && outOfScope.length > 0;

  const handleRemove = (idx: number) => {
    if (!onDeliverablesEdit) return;
    onDeliverablesEdit(deliverables.filter((_, i) => i !== idx));
  };

  const handleAdd = () => {
    if (!onDeliverablesEdit || !newItem.trim()) return;
    onDeliverablesEdit([...deliverables, newItem.trim()]);
    setNewItem("");
    setAdding(false);
  };

  const handleItemEdit = (idx: number, val: string) => {
    if (!onDeliverablesEdit) return;
    const updated = [...deliverables];
    updated[idx] = val;
    onDeliverablesEdit(updated);
  };

  const handleRespEdit = (idx: number, val: string) => {
    if (!onClientResponsibilitiesEdit || !clientResponsibilities) return;
    const updated = [...clientResponsibilities];
    updated[idx] = val;
    onClientResponsibilitiesEdit(updated);
  };

  const handleOosEdit = (idx: number, val: string) => {
    if (!onOutOfScopeEdit || !outOfScope) return;
    const updated = [...outOfScope];
    updated[idx] = val;
    onOutOfScopeEdit(updated);
  };

  const renderRemoveButton = () => onRemove && (
    <button
      onClick={onRemove}
      className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-md transition-opacity group-hover/card:opacity-100 print:hidden"
      title="Remove service"
    >
      <X className="h-3 w-3" />
    </button>
  );

  const renderDeliverablesEdit = () => (
    editable && (
      <div className="mt-3 print:hidden">
        {adding ? (
          <div className="flex items-center gap-2">
            <input
              type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setAdding(false); setNewItem(''); } }}
              placeholder="New deliverable..." autoFocus
              className="flex-1 border border-[#E0E0E0] rounded-lg px-3 py-1.5 text-[#555] outline-none focus:border-[#BBB]"
              style={{ fontSize: "13px" }}
            />
            <button onClick={handleAdd} className="text-[#888] hover:text-[#555] text-xs font-medium">Add</button>
            <button onClick={() => { setAdding(false); setNewItem(''); }} className="text-[#CCC] hover:text-[#888]">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-[#BBB] hover:text-[#888] transition-colors" style={{ fontSize: "12px" }}>
            <Plus className="h-3 w-3" /> Add deliverable
          </button>
        )}
      </div>
    )
  );

  const respSuggestions = [...(moduleDefaultResponsibilities || []), ...GENERIC_RESPONSIBILITIES];
  const oosSuggestions = [...(moduleDefaultOutOfScope || []), ...GENERIC_OUT_OF_SCOPE];

  const renderResponsibilitiesEdit = () => editableResp && (
    <ListAddButton isAdding={addingResp} setIsAdding={setAddingResp} inputValue={newResp} setInputValue={setNewResp}
      onAdd={onClientResponsibilitiesEdit!} currentItems={clientResponsibilities || []} label="responsibility" suggestions={respSuggestions} />
  );
  const renderOutOfScopeEdit = () => editableOos && (
    <ListAddButton isAdding={addingOos} setIsAdding={setAddingOos} inputValue={newOos} setInputValue={setNewOos}
      onAdd={onOutOfScopeEdit!} currentItems={outOfScope || []} label="out of scope item" suggestions={oosSuggestions} />
  );

  // ── Soft template ──
  if (isSoft) {
    const border = template.colors.border;
    const bg = template.colors.background;
    const muted = template.colors.textBody;

    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5, ease: "easeOut" }}
        className="group relative rounded-2xl p-7 transition-all duration-300"
        style={{
          background: "white", fontFamily: "'DM Sans', sans-serif",
          border: `1px solid ${border}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = `${accent}4D`;
          e.currentTarget.style.boxShadow = `0 10px 30px -5px ${accent}1A`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = border;
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {renderRemoveButton()}
        {isAddon && (
          <span className="absolute top-4 right-4 px-3 py-1 rounded-full text-white uppercase tracking-wider"
            style={{ background: accent, fontSize: "10px", fontWeight: 600 }}>
            Add-on
          </span>
        )}
        <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-105"
          style={{ background: bg, color: accent }}>
          {icon}
        </div>
        {onNameEdit ? (
          <EditableText value={name} placeholder="Service name..." onSave={onNameEdit} as="h3"
            className="mb-3" style={{ fontSize: "19px", fontWeight: 600, lineHeight: 1.2, color: dark }} />
        ) : (
          <h3 className="mb-3" style={{ fontSize: "19px", fontWeight: 600, lineHeight: 1.2, color: dark }}>{name}</h3>
        )}
        {onDescriptionEdit ? (
          <EditableText value={description} placeholder="Click to add a description..." onSave={onDescriptionEdit} as="p"
            className="mb-6" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.7, color: muted }} />
        ) : (
          <p className="mb-6" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.7, color: muted }}>{description}</p>
        )}
        <div className="pt-5" style={{ borderTop: `1px solid ${border}` }}>
          <ul className="space-y-2">
            {deliverables.map((item, idx) => (
              <li key={idx} className="group/del flex items-start gap-2.5">
                <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8.5L6.5 12L13 4" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {editable ? (
                  <EditableText value={item} placeholder="Deliverable..." onSave={(val) => handleItemEdit(idx, val)} as="span"
                    className="flex-1" style={{ fontSize: "13px", fontWeight: 400, lineHeight: 1.5, color: muted }} />
                ) : (
                  <span style={{ fontSize: "13px", fontWeight: 400, lineHeight: 1.5, color: muted }}>{item}</span>
                )}
                {editable && (
                  <button onClick={() => handleRemove(idx)}
                    className="shrink-0 mt-0.5 opacity-0 group-hover/del:opacity-100 transition-opacity text-[#CCC] hover:text-red-400 print:hidden"
                    title="Remove deliverable"><X className="h-3.5 w-3.5" /></button>
                )}
              </li>
            ))}
          </ul>
          {renderDeliverablesEdit()}

          {/* Client Responsibilities */}
          {(hasResponsibilities || editableResp) && (
            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${border}` }}>
              <span className="block mb-2" style={{ fontSize: "10px", fontWeight: 600, color: template.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Client Responsibilities
              </span>
              {hasResponsibilities && (
                <CollapsibleList
                  items={clientResponsibilities!}
                  renderItem={(item, idx) => (
                    <li key={idx} className="group/resp flex items-start gap-2.5">
                      <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8.5L6.5 12L13 4" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                      </svg>
                      {editableResp ? (
                        <EditableText value={item} placeholder="Responsibility..." onSave={(val) => handleRespEdit(idx, val)} as="span"
                          className="flex-1" style={{ fontSize: "12px", fontWeight: 400, lineHeight: 1.5, color: template.colors.textMuted }} />
                      ) : (
                        <span className="flex-1" style={{ fontSize: "12px", fontWeight: 400, lineHeight: 1.5, color: template.colors.textMuted }}>{item}</span>
                      )}
                      {editableResp && (
                        <button onClick={() => onClientResponsibilitiesEdit!(clientResponsibilities!.filter((_, i) => i !== idx))}
                          className="shrink-0 mt-0.5 opacity-0 group-hover/resp:opacity-100 transition-opacity text-[#CCC] hover:text-red-400 print:hidden"
                          title="Remove"><X className="h-3 w-3" /></button>
                      )}
                    </li>
                  )}
                />
              )}
              {renderResponsibilitiesEdit()}
            </div>
          )}

          {/* Out of Scope */}
          {(hasOutOfScope || editableOos) && (
            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${border}` }}>
              <span className="block mb-2" style={{ fontSize: "10px", fontWeight: 600, color: template.colors.textFaint, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Out of Scope
              </span>
              {hasOutOfScope && (
                <CollapsibleList
                  items={outOfScope!}
                  renderItem={(item, idx) => (
                    <li key={idx} className="group/oos flex items-start gap-2">
                      <span className="mt-1.5 shrink-0" style={{ fontSize: "10px", color: template.colors.textFaint }}>—</span>
                      {editableOos ? (
                        <EditableText value={item} placeholder="Out of scope item..." onSave={(val) => handleOosEdit(idx, val)} as="span"
                          className="flex-1" style={{ fontSize: "12px", fontWeight: 400, lineHeight: 1.5, color: template.colors.textFaint }} />
                      ) : (
                        <span className="flex-1" style={{ fontSize: "12px", fontWeight: 400, lineHeight: 1.5, color: template.colors.textFaint }}>{item}</span>
                      )}
                      {editableOos && (
                        <button onClick={() => onOutOfScopeEdit!(outOfScope!.filter((_, i) => i !== idx))}
                          className="shrink-0 mt-0.5 opacity-0 group-hover/oos:opacity-100 transition-opacity text-[#CCC] hover:text-red-400 print:hidden"
                          title="Remove"><X className="h-3 w-3" /></button>
                      )}
                    </li>
                  )}
                />
              )}
              {renderOutOfScopeEdit()}
            </div>
          )}

          <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${border}` }}>
            <span style={{ fontSize: "13px", fontWeight: 500, color: template.colors.textMuted }}>
              {price}{suffix && <span style={{ fontWeight: 400, opacity: 0.6 }}>{suffix}</span>}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Elegant template ──
  if (isElegant) {
    const accentTint = `${accent}0F`;
    const secondaryTint = `${secondary}26`;
    const border = template.colors.border;
    const muted = template.colors.textMuted;
    const faint = template.colors.textFaint;

    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5, ease: "easeOut" }}
        className="group relative rounded-3xl p-8 transition-all duration-300"
        style={{
          background: "white", fontFamily: "'DM Sans', sans-serif",
          border: `1px solid ${border}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = `${accent}40`;
          e.currentTarget.style.boxShadow = `0 20px 40px -10px ${accent}0D`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = border;
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {renderRemoveButton()}
        {/* Price Badge */}
        <div className="absolute top-6 right-6">
          <div className="px-4 py-1.5 rounded-full"
            style={{ background: isAddon ? secondaryTint : accentTint, color: isAddon ? secondary : accent, fontSize: "13px", fontWeight: 600 }}>
            {price}{suffix && <span style={{ fontWeight: 400, opacity: 0.6 }}>{suffix}</span>}
          </div>
        </div>

        {isAddon && (
          <span className="inline-block px-3 py-1 rounded-full mb-3 uppercase tracking-wider"
            style={{ background: secondaryTint, color: secondary, fontSize: "10px", fontWeight: 600 }}>
            Add-on
          </span>
        )}

        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300"
          style={{ background: accentTint, color: accent }}
          onMouseEnter={(e) => { e.currentTarget.style.background = accent; e.currentTarget.style.color = "white"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = accentTint; e.currentTarget.style.color = accent; }}
        >
          {icon}
        </div>

        {onNameEdit ? (
          <EditableText value={name} placeholder="Service name..." onSave={onNameEdit} as="h3"
            className="mb-3"
            style={{ fontFamily: "'Fraunces', serif", fontSize: "20px", fontWeight: 500, lineHeight: 1.2, color: dark }} />
        ) : (
          <h3 className="mb-3" style={{ fontFamily: "'Fraunces', serif", fontSize: "20px", fontWeight: 500, lineHeight: 1.2, color: dark }}>
            {name}
          </h3>
        )}

        {onDescriptionEdit ? (
          <EditableText value={description} placeholder="Click to add a description..." onSave={onDescriptionEdit} as="p"
            className="mb-6" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.7, color: muted }} />
        ) : (
          <p className="mb-6" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.7, color: muted }}>
            {description}
          </p>
        )}

        {/* Deliverables */}
        <div className="pt-5" style={{ borderTop: `1px solid ${border}` }}>
          <span className="block mb-3 uppercase tracking-widest"
            style={{ fontSize: "10px", fontWeight: 600, color: faint }}>Deliverables</span>
          <ul className="space-y-2">
            {deliverables.map((item, idx) => (
              <li key={idx} className="group/del flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: `${accent}66` }} />
                {editable ? (
                  <EditableText value={item} placeholder="Deliverable..." onSave={(val) => handleItemEdit(idx, val)} as="span"
                    className="flex-1" style={{ fontSize: "13px", fontWeight: 400, lineHeight: 1.5, color: template.colors.textBody }} />
                ) : (
                  <span style={{ fontSize: "13px", fontWeight: 400, lineHeight: 1.5, color: template.colors.textBody }}>{item}</span>
                )}
                {editable && (
                  <button onClick={() => handleRemove(idx)}
                    className="shrink-0 mt-0.5 opacity-0 group-hover/del:opacity-100 transition-opacity text-[#CCC] hover:text-red-400 print:hidden"
                    title="Remove deliverable"><X className="h-3.5 w-3.5" /></button>
                )}
              </li>
            ))}
          </ul>
          {renderDeliverablesEdit()}
        </div>

        {/* Client Responsibilities */}
        {(hasResponsibilities || editableResp) && (
          <div className="pt-4 mt-4" style={{ borderTop: `1px solid ${border}` }}>
            <span className="block mb-2.5 uppercase tracking-widest"
              style={{ fontSize: "10px", fontWeight: 600, color: `${accent}99` }}>Client Responsibilities</span>
            {hasResponsibilities && (
              <CollapsibleList
                items={clientResponsibilities!}
                renderItem={(item, idx) => (
                  <li key={idx} className="group/resp flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: `${accent}33` }} />
                    {editableResp ? (
                      <EditableText value={item} placeholder="Responsibility..." onSave={(val) => handleRespEdit(idx, val)} as="span"
                        className="flex-1" style={{ fontSize: "12px", fontWeight: 400, lineHeight: 1.5, color: muted }} />
                    ) : (
                      <span className="flex-1" style={{ fontSize: "12px", fontWeight: 400, lineHeight: 1.5, color: muted }}>{item}</span>
                    )}
                    {editableResp && (
                      <button onClick={() => onClientResponsibilitiesEdit!(clientResponsibilities!.filter((_, i) => i !== idx))}
                        className="shrink-0 mt-0.5 opacity-0 group-hover/resp:opacity-100 transition-opacity text-[#CCC] hover:text-red-400 print:hidden"
                        title="Remove"><X className="h-3 w-3" /></button>
                    )}
                  </li>
                )}
              />
            )}
            {renderResponsibilitiesEdit()}
          </div>
        )}

        {/* Out of Scope */}
        {(hasOutOfScope || editableOos) && (
          <div className="pt-4 mt-4" style={{ borderTop: `1px solid ${border}` }}>
            <span className="block mb-2.5 uppercase tracking-widest"
              style={{ fontSize: "10px", fontWeight: 600, color: faint }}>Out of Scope</span>
            {hasOutOfScope && (
              <CollapsibleList
                items={outOfScope!}
                renderItem={(item, idx) => (
                  <li key={idx} className="group/oos flex items-start gap-2">
                    <span className="mt-1.5 shrink-0" style={{ fontSize: "10px", color: faint }}>✕</span>
                    {editableOos ? (
                      <EditableText value={item} placeholder="Out of scope item..." onSave={(val) => handleOosEdit(idx, val)} as="span"
                        className="flex-1" style={{ fontSize: "12px", fontWeight: 400, lineHeight: 1.5, color: faint }} />
                    ) : (
                      <span className="flex-1" style={{ fontSize: "12px", fontWeight: 400, lineHeight: 1.5, color: faint }}>{item}</span>
                    )}
                    {editableOos && (
                      <button onClick={() => onOutOfScopeEdit!(outOfScope!.filter((_, i) => i !== idx))}
                        className="shrink-0 mt-0.5 opacity-0 group-hover/oos:opacity-100 transition-opacity text-[#CCC] hover:text-red-400 print:hidden"
                        title="Remove"><X className="h-3 w-3" /></button>
                    )}
                  </li>
                )}
              />
            )}
            {renderOutOfScopeEdit()}
          </div>
        )}
      </motion.div>
    );
  }

  // ── Modern template ──
  if (isModern) {
    const borderColor = template.colors.border;
    const muted = template.colors.textMuted;
    const body = template.colors.textBody;
    const faint = template.colors.textFaint;
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5, ease: "easeOut" }}
        className="group relative rounded-3xl p-7 transition-transform duration-300 hover:-translate-y-1"
        style={{
          background: template.colors.cardBackground, fontFamily: "'Outfit', sans-serif",
          border: `2px solid ${borderColor}`,
          boxShadow: `0 2px 12px ${dark}0A`,
        }}
      >
        {renderRemoveButton()}
        <div className="absolute -top-3 -right-2 z-10">
          <div className="px-4 py-2 rounded-2xl"
            style={{ background: dark, color: "white", fontSize: "14px", fontWeight: 700, boxShadow: `3px 3px 0px ${accent}` }}>
            {price}{suffix && <span style={{ fontWeight: 400, opacity: 0.6 }}>{suffix}</span>}
          </div>
        </div>
        {isAddon && (
          <span className="inline-block px-3 py-1 rounded-full mb-3 uppercase tracking-wider"
            style={{ background: `${secondary}18`, color: secondary, fontSize: "10px", fontWeight: 700 }}>
            Add-on
          </span>
        )}
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: `${accent}10`, color: accent }}>
          {icon}
        </div>
        {onNameEdit ? (
          <EditableText value={name} placeholder="Service name..." onSave={onNameEdit} as="h3"
            className="mb-3"
            style={{ fontFamily: "'Fraunces', serif", fontSize: "20px", fontWeight: 700, lineHeight: 1.2, color: dark }} />
        ) : (
          <h3 className="mb-3" style={{ fontFamily: "'Fraunces', serif", fontSize: "20px", fontWeight: 700, lineHeight: 1.2, color: dark }}>
            {name}
          </h3>
        )}
        {onDescriptionEdit ? (
          <EditableText value={description} placeholder="Click to add a description..." onSave={onDescriptionEdit} as="p"
            className="mb-6" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.7, color: muted }} />
        ) : (
          <p className="mb-6" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.7, color: muted }}>
            {description}
          </p>
        )}
        <div className="pt-5" style={{ borderTop: `2px dashed ${borderColor}` }}>
          <span className="block mb-3 uppercase tracking-widest"
            style={{ fontSize: "10px", fontWeight: 700, color: accent }}>Deliverables</span>
          <ul className="space-y-2">
            {deliverables.map((item, idx) => (
              <li key={idx} className="group/del flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: accent }} />
                {editable ? (
                  <EditableText value={item} placeholder="Deliverable..." onSave={(val) => handleItemEdit(idx, val)} as="span"
                    className="flex-1" style={{ fontSize: "13px", fontWeight: 400, lineHeight: 1.5, color: body }} />
                ) : (
                  <span style={{ fontSize: "13px", fontWeight: 400, lineHeight: 1.5, color: body }}>{item}</span>
                )}
                {editable && (
                  <button onClick={() => handleRemove(idx)}
                    className="shrink-0 mt-0.5 opacity-0 group-hover/del:opacity-100 transition-opacity text-[#CCC] hover:text-red-400 print:hidden"
                    title="Remove deliverable"><X className="h-3.5 w-3.5" /></button>
                )}
              </li>
            ))}
          </ul>
          {renderDeliverablesEdit()}
        </div>

        {/* Client Responsibilities */}
        {(hasResponsibilities || editableResp) && (
          <div className="pt-4 mt-4" style={{ borderTop: `2px dashed ${borderColor}` }}>
            <span className="block mb-2.5 uppercase tracking-widest"
              style={{ fontSize: "10px", fontWeight: 700, color: accent }}>Client Responsibilities</span>
            {hasResponsibilities && (
              <CollapsibleList
                items={clientResponsibilities!}
                renderItem={(item, idx) => (
                  <li key={idx} className="group/resp flex items-start gap-2.5">
                    <span className="mt-1.5 shrink-0" style={{ fontSize: "11px", color: accent }}>→</span>
                    {editableResp ? (
                      <EditableText value={item} placeholder="Responsibility..." onSave={(val) => handleRespEdit(idx, val)} as="span"
                        className="flex-1" style={{ fontSize: "12px", fontWeight: 400, lineHeight: 1.5, color: body }} />
                    ) : (
                      <span className="flex-1" style={{ fontSize: "12px", fontWeight: 400, lineHeight: 1.5, color: body }}>{item}</span>
                    )}
                    {editableResp && (
                      <button onClick={() => onClientResponsibilitiesEdit!(clientResponsibilities!.filter((_, i) => i !== idx))}
                        className="shrink-0 mt-0.5 opacity-0 group-hover/resp:opacity-100 transition-opacity text-[#CCC] hover:text-red-400 print:hidden"
                        title="Remove"><X className="h-3 w-3" /></button>
                    )}
                  </li>
                )}
              />
            )}
            {renderResponsibilitiesEdit()}
          </div>
        )}

        {/* Out of Scope */}
        {(hasOutOfScope || editableOos) && (
          <div className="pt-4 mt-4" style={{ borderTop: `2px dashed ${borderColor}` }}>
            <span className="block mb-2.5 uppercase tracking-widest"
              style={{ fontSize: "10px", fontWeight: 700, color: faint }}>Out of Scope</span>
            {hasOutOfScope && (
              <CollapsibleList
                items={outOfScope!}
                renderItem={(item, idx) => (
                  <li key={idx} className="group/oos flex items-start gap-2">
                    <span className="mt-1 shrink-0" style={{ fontSize: "11px", fontWeight: 700, color: faint }}>×</span>
                    {editableOos ? (
                      <EditableText value={item} placeholder="Out of scope item..." onSave={(val) => handleOosEdit(idx, val)} as="span"
                        className="flex-1" style={{ fontSize: "12px", fontWeight: 400, lineHeight: 1.5, color: muted }} />
                    ) : (
                      <span className="flex-1" style={{ fontSize: "12px", fontWeight: 400, lineHeight: 1.5, color: muted }}>{item}</span>
                    )}
                    {editableOos && (
                      <button onClick={() => onOutOfScopeEdit!(outOfScope!.filter((_, i) => i !== idx))}
                        className="shrink-0 mt-0.5 opacity-0 group-hover/oos:opacity-100 transition-opacity text-[#CCC] hover:text-red-400 print:hidden"
                        title="Remove"><X className="h-3 w-3" /></button>
                    )}
                  </li>
                )}
              />
            )}
            {renderOutOfScopeEdit()}
          </div>
        )}
      </motion.div>
    );
  }

  // ── Classic template ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="group relative bg-white border border-[#EBEBEB] rounded-2xl p-8 transition-all duration-300"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${brand.primaryColor}4D`;
        e.currentTarget.style.boxShadow = `0 10px 30px -10px ${brand.primaryColor}15`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#EBEBEB";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {renderRemoveButton()}
      <div className="absolute top-6 right-6">
        <span className="inline-block text-white px-4 py-1.5 rounded-full"
          style={{ fontSize: "13px", fontWeight: 600, backgroundColor: brand.darkColor }}>
          {price}{suffix && <span style={{ fontWeight: 400, opacity: 0.6 }}>{suffix}</span>}
        </span>
      </div>
      {isAddon && (
        <span className="inline-block px-3 py-1 rounded-full mb-4 uppercase tracking-[0.15em]"
          style={{ fontSize: "10px", fontWeight: 600, backgroundColor: `${brand.primaryColor}15`, color: brand.primaryColor }}>
          Add-on
        </span>
      )}
      <div className="w-12 h-12 rounded-xl border flex items-center justify-center mb-5 transition-all duration-300"
        style={{ backgroundColor: "#FAFAFA", borderColor: "#EBEBEB", color: brand.darkColor }}>
        {icon}
      </div>
      {onNameEdit ? (
        <EditableText value={name} placeholder="Service name..." onSave={onNameEdit} as="h3"
          className="mb-3 tracking-tight"
          style={{ fontSize: "20px", fontWeight: 700, lineHeight: 1.2, color: brand.darkColor }} />
      ) : (
        <h3 className="mb-3 tracking-tight" style={{ fontSize: "20px", fontWeight: 700, lineHeight: 1.2, color: brand.darkColor }}>{name}</h3>
      )}
      {onDescriptionEdit ? (
        <EditableText value={description} placeholder="Click to add a description..." onSave={onDescriptionEdit} as="p"
          className="text-[#888] mb-6" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.6 }} />
      ) : (
        <p className="text-[#888] mb-6" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.6 }}>{description}</p>
      )}
      <div className="border-t border-[#F0F0F0] pt-5">
        <span className="block text-[#BBB] uppercase tracking-[0.2em] mb-3" style={{ fontSize: "10px", fontWeight: 600 }}>
          Deliverables
        </span>
        <ul className="space-y-2">
          {deliverables.map((item, idx) => (
            <li key={idx} className="group/del flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: brand.primaryColor }} />
              {editable ? (
                <EditableText value={item} placeholder="Deliverable..." onSave={(val) => handleItemEdit(idx, val)} as="span"
                  className="text-[#555] flex-1" style={{ fontSize: "13px", fontWeight: 400, lineHeight: 1.5 }} />
              ) : (
                <span className="text-[#555]" style={{ fontSize: "13px", fontWeight: 400, lineHeight: 1.5 }}>{item}</span>
              )}
              {editable && (
                <button onClick={() => handleRemove(idx)}
                  className="shrink-0 mt-0.5 opacity-0 group-hover/del:opacity-100 transition-opacity text-[#CCC] hover:text-red-400 print:hidden"
                  title="Remove deliverable"><X className="h-3.5 w-3.5" /></button>
              )}
            </li>
          ))}
        </ul>
        {renderDeliverablesEdit()}
      </div>

      {/* Client Responsibilities */}
      {(hasResponsibilities || editableResp) && (
        <div className="border-t border-[#F0F0F0] pt-4 mt-4">
          <span className="block text-[#CCC] uppercase tracking-[0.2em] mb-2.5" style={{ fontSize: "10px", fontWeight: 600 }}>
            Client Responsibilities
          </span>
          {hasResponsibilities && (
            <CollapsibleList
              items={clientResponsibilities!}
              renderItem={(item, idx) => (
                <li key={idx} className="group/resp flex items-start gap-2.5">
                  <span className="mt-1.5 shrink-0 text-[#BBB]" style={{ fontSize: "11px" }}>→</span>
                  {editableResp ? (
                    <EditableText value={item} placeholder="Responsibility..." onSave={(val) => handleRespEdit(idx, val)} as="span"
                      className="text-[#888] flex-1" style={{ fontSize: "12px", fontWeight: 400, lineHeight: 1.5 }} />
                  ) : (
                    <span className="text-[#888] flex-1" style={{ fontSize: "12px", fontWeight: 400, lineHeight: 1.5 }}>{item}</span>
                  )}
                  {editableResp && (
                    <button onClick={() => onClientResponsibilitiesEdit!(clientResponsibilities!.filter((_, i) => i !== idx))}
                      className="shrink-0 mt-0.5 opacity-0 group-hover/resp:opacity-100 transition-opacity text-[#CCC] hover:text-red-400 print:hidden"
                      title="Remove"><X className="h-3 w-3" /></button>
                  )}
                </li>
              )}
            />
          )}
          {renderResponsibilitiesEdit()}
        </div>
      )}

      {/* Out of Scope */}
      {(hasOutOfScope || editableOos) && (
        <div className="border-t border-[#F0F0F0] pt-4 mt-4">
          <span className="block text-[#DDD] uppercase tracking-[0.2em] mb-2.5" style={{ fontSize: "10px", fontWeight: 600 }}>
            Out of Scope
          </span>
          {hasOutOfScope && (
            <CollapsibleList
              items={outOfScope!}
              renderItem={(item, idx) => (
                <li key={idx} className="group/oos flex items-start gap-2">
                  <span className="mt-1 shrink-0 text-[#CCC]" style={{ fontSize: "11px", fontWeight: 700 }}>×</span>
                  {editableOos ? (
                    <EditableText value={item} placeholder="Out of scope item..." onSave={(val) => handleOosEdit(idx, val)} as="span"
                      className="text-[#AAA] flex-1" style={{ fontSize: "12px", fontWeight: 400, lineHeight: 1.5 }} />
                  ) : (
                    <span className="text-[#AAA] flex-1" style={{ fontSize: "12px", fontWeight: 400, lineHeight: 1.5 }}>{item}</span>
                  )}
                  {editableOos && (
                    <button onClick={() => onOutOfScopeEdit!(outOfScope!.filter((_, i) => i !== idx))}
                      className="shrink-0 mt-0.5 opacity-0 group-hover/oos:opacity-100 transition-opacity text-[#CCC] hover:text-red-400 print:hidden"
                      title="Remove"><X className="h-3 w-3" /></button>
                  )}
                </li>
              )}
            />
          )}
          {renderOutOfScopeEdit()}
        </div>
      )}
    </motion.div>
  );
}
