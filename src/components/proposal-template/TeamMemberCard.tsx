import React from "react";
import { motion } from "motion/react";
import { useTemplate } from "./TemplateProvider";

interface TeamMemberCardProps {
  name: string;
  title: string;
  photoUrl?: string | null;
  bio?: string | null;
  roleOnProject?: string | null;
  delay?: number;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).filter(Boolean).join('').toUpperCase().slice(0, 2);
}

export function TeamMemberCard({ name, title, photoUrl, bio, roleOnProject, delay = 0 }: TeamMemberCardProps) {
  const template = useTemplate();
  const accent = template.colors.primaryAccent;
  const dark = template.colors.primaryDark;
  const isModern = template.id === 'modern';
  const isElegant = template.id === 'elegant';
  const isSoft = template.id === 'soft';

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

  if (isSoft) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        className="flex flex-col items-center text-center p-5 rounded-xl"
        style={{ background: 'white', border: `1px solid ${template.colors.border}`, fontFamily: "'DM Sans', sans-serif" }}
      >
        <Avatar />
        <p className="mt-3 font-semibold" style={{ fontSize: '14px', color: dark }}>{name}</p>
        <p className="mt-0.5" style={{ fontSize: '12px', color: template.colors.textMuted }}>{title}</p>
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
        className="flex flex-col items-center text-center p-5 rounded-2xl"
        style={{ background: 'white', border: `1px solid ${template.colors.border}`, fontFamily: "'DM Sans', sans-serif" }}
      >
        <Avatar />
        <p className="mt-3" style={{ fontFamily: "'Fraunces', serif", fontSize: '14px', fontWeight: 500, color: dark }}>{name}</p>
        <p className="mt-0.5" style={{ fontSize: '12px', color: template.colors.textMuted }}>{title}</p>
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
        className="flex flex-col items-center text-center p-6 rounded-2xl"
        style={{
          background: template.colors.cardBackground,
          border: `2px solid ${template.colors.border}`,
          boxShadow: `3px 3px 0px ${dark}0A`,
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        <Avatar />
        <p className="mt-3" style={{ fontFamily: "'Fraunces', serif", fontSize: '14px', fontWeight: 700, color: dark }}>{name}</p>
        <p className="mt-0.5" style={{ fontSize: '12px', color: template.colors.textMuted }}>{title}</p>
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
      className="flex flex-col items-center text-center p-5"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      <Avatar />
      <p className="mt-3 font-bold" style={{ fontSize: '14px', color: dark }}>{name}</p>
      <p className="mt-0.5" style={{ fontSize: '12px', color: '#888', fontFamily: "'Inter', sans-serif" }}>{title}</p>
      {roleOnProject && (
        <span className="mt-2 inline-block rounded-full px-2.5 py-0.5"
          style={{ fontSize: '10px', fontWeight: 600, background: `${accent}15`, color: accent }}>
          {roleOnProject}
        </span>
      )}
    </motion.div>
  );
}
