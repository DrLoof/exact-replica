import React, { useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { useTemplate } from "./TemplateProvider";

interface TeamMemberCardProps {
  name: string;
  title: string;
  photoUrl?: string | null;
  bio?: string | null;
  roleOnProject?: string | null;
  delay?: number;
  onRemove?: () => void;
  onNameEdit?: (value: string) => void;
  onTitleEdit?: (value: string) => void;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).filter(Boolean).join('').toUpperCase().slice(0, 2);
}

function InlineEditable({ value, onSave, style, className }: { value: string; onSave?: (v: string) => void; style?: React.CSSProperties; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!onSave) return <span style={style} className={className}>{value}</span>;

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { if (draft.trim() && draft !== value) onSave(draft.trim()); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur(); } if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        className="bg-transparent outline-none border-b border-dashed border-current text-center w-full"
        style={{ ...style, minWidth: 0 }}
      />
    );
  }

  return (
    <span
      onClick={() => { setDraft(value); setEditing(true); }}
      className={`cursor-text hover:border-b hover:border-dashed hover:border-current ${className || ''}`}
      style={style}
    >
      {value || 'Click to edit'}
    </span>
  );
}

export function TeamMemberCard({ name, title, photoUrl, bio, roleOnProject, delay = 0, onRemove, onNameEdit, onTitleEdit }: TeamMemberCardProps) {
  const template = useTemplate();
  const accent = template.colors.primaryAccent;
  const dark = template.colors.primaryDark;
  const isModern = template.id === 'modern';
  const isElegant = template.id === 'elegant';
  const isSoft = template.id === 'soft';
  const [hovered, setHovered] = useState(false);

  const initials = getInitials(name);

  const Avatar = () => (
    photoUrl ? (
      <img src={photoUrl} alt={name} className="h-16 w-16 rounded-full object-cover" />
    ) : (
      <div className="h-16 w-16 rounded-full flex items-center justify-center text-white font-semibold"
        style={{
          backgroundColor: isSoft ? `${accent}CC` : isElegant ? `${accent}99` : accent,
          fontSize: '18px',
        }}>
        {initials}
      </div>
    )
  );

  const RemoveButton = () => onRemove ? (
    <button
      onClick={(e) => { e.stopPropagation(); onRemove(); }}
      className={`absolute -top-2 -right-2 z-10 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md transition-opacity print:hidden ${hovered ? 'opacity-100' : 'opacity-0'}`}
    >
      <X className="h-3.5 w-3.5" />
    </button>
  ) : null;

  const nameStyle = (base: React.CSSProperties) => base;
  const titleStyle = (base: React.CSSProperties) => base;

  if (isSoft) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        className="relative flex flex-col items-center text-center p-5 rounded-xl"
        style={{ background: 'white', border: `1px solid ${template.colors.border}`, fontFamily: "'DM Sans', sans-serif" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <RemoveButton />
        <Avatar />
        <InlineEditable value={name} onSave={onNameEdit} style={{ fontSize: '14px', fontWeight: 600, color: dark, marginTop: '12px', display: 'block' }} />
        <InlineEditable value={title} onSave={onTitleEdit} style={{ fontSize: '12px', color: template.colors.textMuted, marginTop: '2px', display: 'block' }} />
        {roleOnProject && (
          <span className="mt-2 inline-block rounded-full px-2.5 py-0.5"
            style={{ fontSize: '10px', fontWeight: 600, background: `${accent}15`, color: accent }}>
            {roleOnProject}
          </span>
        )}
      </motion.div>
    );
  }

  if (isElegant) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        className="relative flex flex-col items-center text-center p-5 rounded-2xl"
        style={{ background: 'white', border: `1px solid ${template.colors.border}`, fontFamily: "'DM Sans', sans-serif" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <RemoveButton />
        <Avatar />
        <InlineEditable value={name} onSave={onNameEdit} style={{ fontFamily: "'Fraunces', serif", fontSize: '14px', fontWeight: 500, color: dark, marginTop: '12px', display: 'block' }} />
        <InlineEditable value={title} onSave={onTitleEdit} style={{ fontSize: '12px', color: template.colors.textMuted, marginTop: '2px', display: 'block' }} />
        {roleOnProject && (
          <span className="mt-2 inline-block rounded-full px-2.5 py-0.5"
            style={{ fontSize: '10px', fontWeight: 500, background: `${accent}10`, color: accent }}>
            {roleOnProject}
          </span>
        )}
      </motion.div>
    );
  }

  if (isModern) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        className="relative flex flex-col items-center text-center p-6 rounded-2xl"
        style={{
          background: template.colors.cardBackground,
          border: `2px solid ${template.colors.border}`,
          boxShadow: `3px 3px 0px ${dark}0A`,
          fontFamily: "'Outfit', sans-serif",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <RemoveButton />
        <Avatar />
        <InlineEditable value={name} onSave={onNameEdit} style={{ fontFamily: "'Fraunces', serif", fontSize: '14px', fontWeight: 700, color: dark, marginTop: '12px', display: 'block' }} />
        <InlineEditable value={title} onSave={onTitleEdit} style={{ fontSize: '12px', color: template.colors.textMuted, marginTop: '2px', display: 'block' }} />
        {roleOnProject && (
          <span className="mt-2 inline-block rounded-full px-3 py-1"
            style={{ fontSize: '10px', fontWeight: 600, background: accent, color: 'white' }}>
            {roleOnProject}
          </span>
        )}
      </motion.div>
    );
  }

  // Classic
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="relative flex flex-col items-center text-center p-5"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <RemoveButton />
      <Avatar />
      <InlineEditable value={name} onSave={onNameEdit} style={{ fontSize: '14px', fontWeight: 700, color: dark, marginTop: '12px', display: 'block' }} />
      <InlineEditable value={title} onSave={onTitleEdit} style={{ fontSize: '12px', color: '#888', fontFamily: "'Inter', sans-serif", marginTop: '2px', display: 'block' }} />
      {roleOnProject && (
        <span className="mt-2 inline-block rounded-full px-2.5 py-0.5"
          style={{ fontSize: '10px', fontWeight: 600, background: `${accent}15`, color: accent }}>
          {roleOnProject}
        </span>
      )}
    </motion.div>
  );
}
