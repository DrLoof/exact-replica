import React, { type ReactNode, useState } from "react";
import { motion } from "motion/react";
import { Plus, X } from "lucide-react";
import { useBrand } from "./BrandTheme";
import { EditableText } from "./EditableText";

interface ServiceCardProps {
  icon: ReactNode;
  name: string;
  price: string;
  pricingModel?: "fixed" | "monthly" | "hourly" | "per_unit";
  description: string;
  deliverables: string[];
  isAddon?: boolean;
  delay?: number;
  onNameEdit?: (value: string) => void;
  onDescriptionEdit?: (value: string) => void;
  onDeliverablesEdit?: (deliverables: string[]) => void;
}

const MODEL_LABELS: Record<string, string> = {
  fixed: "",
  monthly: "/mo",
  hourly: "/hr",
  per_unit: "/unit",
};

export function ServiceCard({
  icon,
  name,
  price,
  pricingModel,
  description,
  deliverables,
  isAddon = false,
  delay = 0,
  onNameEdit,
  onDescriptionEdit,
  onDeliverablesEdit,
}: ServiceCardProps) {
  const brand = useBrand();
  const suffix = pricingModel ? MODEL_LABELS[pricingModel] || "" : "";
  const [newItem, setNewItem] = useState("");
  const [adding, setAdding] = useState(false);
  const editable = !!onDeliverablesEdit;

  const handleRemove = (idx: number) => {
    if (!onDeliverablesEdit) return;
    const updated = deliverables.filter((_, i) => i !== idx);
    onDeliverablesEdit(updated);
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
      {/* Price badge */}
      <div className="absolute top-6 right-6">
        <span
          className="inline-block text-white px-4 py-1.5 rounded-full"
          style={{ fontSize: "13px", fontWeight: 600, backgroundColor: brand.darkColor }}
        >
          {price}
          {suffix && <span style={{ fontWeight: 400, opacity: 0.6 }}>{suffix}</span>}
        </span>
      </div>

      {/* Add-on badge */}
      {isAddon && (
        <span
          className="inline-block px-3 py-1 rounded-full mb-4 uppercase tracking-[0.15em]"
          style={{ fontSize: "10px", fontWeight: 600, backgroundColor: `${brand.primaryColor}15`, color: brand.primaryColor }}
        >
          Add-on
        </span>
      )}

      {/* Icon */}
      <div
        className="w-12 h-12 rounded-xl border flex items-center justify-center mb-5 transition-all duration-300"
        style={{ backgroundColor: "#FAFAFA", borderColor: "#EBEBEB", color: brand.darkColor }}
      >
        {icon}
      </div>

      {/* Name & description */}
      {onNameEdit ? (
        <EditableText value={name} placeholder="Service name..." onSave={onNameEdit} as="h3"
          className="mb-3 tracking-tight"
          style={{ fontSize: "20px", fontWeight: 700, lineHeight: 1.2, color: brand.darkColor }}
        />
      ) : (
        <h3 className="mb-3 tracking-tight" style={{ fontSize: "20px", fontWeight: 700, lineHeight: 1.2, color: brand.darkColor }}>{name}</h3>
      )}
      {onDescriptionEdit ? (
        <EditableText value={description} placeholder="Click to add a description..." onSave={onDescriptionEdit} as="p"
          className="text-[#888] mb-6" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.6 }}
        />
      ) : (
        <p className="text-[#888] mb-6" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.6 }}>{description}</p>
      )}

      {/* Deliverables */}
      <div className="border-t border-[#F0F0F0] pt-5">
        <span className="block text-[#BBB] uppercase tracking-[0.2em] mb-3" style={{ fontSize: "10px", fontWeight: 600 }}>
          Deliverables
        </span>
        <ul className="space-y-2">
          {deliverables.map((item, idx) => (
            <li key={idx} className="group/del flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: brand.primaryColor }} />
              {editable ? (
                <EditableText
                  value={item}
                  placeholder="Deliverable..."
                  onSave={(val) => handleItemEdit(idx, val)}
                  as="span"
                  className="text-[#555] flex-1"
                  style={{ fontSize: "13px", fontWeight: 400, lineHeight: 1.5 }}
                />
              ) : (
                <span className="text-[#555]" style={{ fontSize: "13px", fontWeight: 400, lineHeight: 1.5 }}>{item}</span>
              )}
              {editable && (
                <button
                  onClick={() => handleRemove(idx)}
                  className="shrink-0 mt-0.5 opacity-0 group-hover/del:opacity-100 transition-opacity text-[#CCC] hover:text-red-400 print:hidden"
                  title="Remove deliverable"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>

        {/* Add deliverable */}
        {editable && (
          <div className="mt-3 print:hidden">
            {adding ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setAdding(false); setNewItem(''); } }}
                  placeholder="New deliverable..."
                  autoFocus
                  className="flex-1 border border-[#E0E0E0] rounded-lg px-3 py-1.5 text-[#555] outline-none focus:border-[#BBB]"
                  style={{ fontSize: "13px" }}
                />
                <button onClick={handleAdd} className="text-[#888] hover:text-[#555] text-xs font-medium">Add</button>
                <button onClick={() => { setAdding(false); setNewItem(''); }} className="text-[#CCC] hover:text-[#888]">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="flex items-center gap-1.5 text-[#BBB] hover:text-[#888] transition-colors"
                style={{ fontSize: "12px" }}
              >
                <Plus className="h-3 w-3" /> Add deliverable
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
