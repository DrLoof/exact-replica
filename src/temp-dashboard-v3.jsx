import { useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   PROPOPAD DASHBOARD — V3: "Quiet Confidence"
   
   Design philosophy:
   The best tools don't shout. They make your WORK feel important,
   not the interface. Think: Notion's warmth + Linear's precision +
   Stripe's data confidence.
   
   Key shifts from V2:
   1. Orange is an ACCENT, not a surface color. Used only for:
      interactive elements (buttons, links, selected states) and
      small indicators. Never as a card fill.
   2. Near-white palette with a single dark card for contrast
   3. Typography does the heavy lifting, not color
   4. Data density feels intentional, not cluttered
   5. The proposal list IS the dashboard — it's what matters most
   ═══════════════════════════════════════════════════════════════ */

// ─── Color Palette ───
// The brand color appears sparingly — like a fountain pen's ink color
const c = {
  brand: "#E8825C",       // warmer, slightly muted coral — less "screamy"
  brandSoft: "#E8825C18", // ghost for hover states
  brandText: "#D4714D",   // for text links (slightly darker for readability)
  
  bg: "#F6F5F3",          // warm paper
  card: "#FFFFFF",
  cardAlt: "#FAFAF8",     // subtle alternating
  dark: "#141311",        // near-black with warmth
  darkSoft: "#1E1D1A",
  
  text: "#1C1B18",
  textSecondary: "#7A756D",
  textMuted: "#B5B0A8",
  
  border: "#EAE8E4",
  borderSoft: "#F0EEEB",
  
  // Status — muted, professional
  statusDraft: "#B5B0A8",
  statusSent: "#5B8DEF",
  statusViewed: "#9175DB",
  statusWon: "#5BAD7A",
  statusLost: "#D97A7A",
};

// ─── Mock Data ───
const proposals = [
  { id: 1, client: "Meridian Technologies", initials: "MT", title: "Brand Evolution & Digital Growth", ref: "SAL-2026-0004", status: "viewed", value: "$48,500", note: "$35K + $4.5K/mo", time: "2h ago", services: 4, engagement: "Viewed 3 sections" },
  { id: 2, client: "Apex Dynamics", initials: "AD", title: "Lead Generation Engine", ref: "SAL-2026-0003", status: "sent", value: "$25,500", note: "$6.5K/mo retainer", time: "3d ago", services: 3, engagement: null },
  { id: 3, client: "Helix Studios", initials: "HS", title: "Social Media & Content Strategy", ref: "SAL-2026-0002", status: "draft", value: "$13,800", note: "$3.8K/mo", time: "Today", services: 2, engagement: null },
  { id: 4, client: "Quantum Health", initials: "QH", title: "Website Redesign & SEO Foundation", ref: "SAL-2026-0001", status: "accepted", value: "$78,000", note: "$55K + $2.5K/mo", time: "1w ago", services: 5, engagement: "Accepted Feb 18" },
];

const statusMap = {
  draft: { label: "Draft", dot: c.statusDraft },
  sent: { label: "Sent", dot: c.statusSent },
  viewed: { label: "Viewed", dot: c.statusViewed },
  accepted: { label: "Won", dot: c.statusWon },
  declined: { label: "Lost", dot: c.statusLost },
};

const activity = [
  { text: "Meridian Technologies viewed Investment section", time: "2h ago", dot: c.statusViewed },
  { text: "Proposal sent to Apex Dynamics", time: "3d ago", dot: c.statusSent },
  { text: "Quantum Health accepted your proposal", time: "1w ago", dot: c.statusWon },
];

const topServices = [
  { name: "Brand Identity", count: 4, pct: 80 },
  { name: "Website Design", count: 3, pct: 60 },
  { name: "SEO Strategy", count: 3, pct: 60 },
  { name: "Social Media", count: 2, pct: 40 },
];

// ─── Components ───

function Sidebar() {
  const nav = [
    { label: "Dashboard", active: true },
    { label: "Proposals", badge: "4" },
    { label: "Clients" },
    { label: "Services" },
    { label: "Bundles" },
  ];
  const settings = ["Agency Profile", "Branding", "Pricing & Terms"];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] flex flex-col"
      style={{ background: c.card, borderRight: `1px solid ${c.border}` }}>
      
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: c.dark }}>
          <span className="text-white text-[10px] font-bold">P</span>
        </div>
        <span className="text-[14px] font-semibold tracking-[-0.01em]" style={{ color: c.text }}>Propopad</span>
      </div>

      {/* Agency */}
      <div className="px-5 mb-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.1em] mb-0.5" style={{ color: c.textMuted }}>Agency</p>
        <p className="text-[13px] font-medium" style={{ color: c.text }}>Salty Communication</p>
      </div>

      <hr style={{ borderColor: c.borderSoft }} />

      {/* Nav */}
      <nav className="px-3 pt-4 flex-1">
        {nav.map(item => (
          <a key={item.label} href="#"
            className="flex items-center justify-between px-3 py-2 rounded-lg mb-0.5 transition-all duration-150"
            style={item.active ? { background: c.brandSoft, color: c.brandText } : { color: c.textSecondary }}>
            <span className="text-[13px]" style={{ fontWeight: item.active ? 600 : 450 }}>{item.label}</span>
            {item.badge && (
              <span className="text-[10px] font-semibold min-w-[18px] text-center py-0.5 rounded"
                style={{ background: item.active ? c.brand : c.borderSoft, color: item.active ? "white" : c.textMuted }}>
                {item.badge}
              </span>
            )}
          </a>
        ))}

        <div className="mt-6 mb-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] px-3" style={{ color: c.textMuted }}>Settings</p>
        </div>
        {settings.map(label => (
          <a key={label} href="#" className="flex items-center px-3 py-2 rounded-lg mb-0.5 transition-colors hover:bg-black/[0.02]">
            <span className="text-[13px]" style={{ color: c.textSecondary, fontWeight: 450 }}>{label}</span>
          </a>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 pb-4">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-black/[0.02] transition-colors cursor-pointer">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ background: c.bg, color: c.textSecondary, border: `1px solid ${c.border}` }}>J</div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium truncate" style={{ color: c.text }}>Johni</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function MetricBlock({ label, value, sub, highlight }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.1em] mb-1" style={{ color: c.textMuted }}>{label}</p>
      <p className="text-[22px] font-semibold tracking-[-0.02em] leading-none" style={{ color: highlight ? "white" : c.text }}>{value}</p>
      {sub && <p className="text-[11px] mt-1" style={{ color: highlight ? "rgba(255,255,255,0.55)" : c.textSecondary }}>{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [selectedServices, setSelectedServices] = useState([]);

  return (
    <div className="min-h-screen flex" style={{ background: c.bg, fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,350;9..40,400;9..40,450;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />
      
      <Sidebar />

      <main className="ml-[240px] flex-1 min-h-screen">
        <div className="max-w-[1080px] mx-auto px-8 py-8">
          
          {/* ─── Header ─── */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-[24px] font-semibold tracking-[-0.02em] mb-0.5" style={{ color: c.text }}>
                Good evening, Johni
              </h1>
              <p className="text-[13px]" style={{ color: c.textSecondary }}>
                4 proposals · $165,800 in pipeline
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-all hover:shadow-md"
              style={{ background: c.dark }}>
              <span className="text-[16px] font-light">+</span>
              New Proposal
            </button>
          </div>

          {/* ─── Metrics Row ─── */}
          <div className="grid grid-cols-12 gap-4 mb-8">
            
            {/* Dark summary card — spans 5 cols */}
            <div className="col-span-5 rounded-2xl p-6 relative overflow-hidden"
              style={{ background: `linear-gradient(160deg, ${c.dark}, ${c.darkSoft})` }}>
              <div className="grid grid-cols-2 gap-6">
                <MetricBlock label="Pipeline" value="$87,800" sub="3 awaiting response" highlight />
                <MetricBlock label="Won this month" value="$78,000" sub="1 deal closed" highlight />
              </div>
              {/* Subtle decorative element */}
              <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full"
                style={{ background: c.brand, opacity: 0.06, filter: "blur(30px)" }} />
            </div>

            {/* Light metric cards */}
            <div className="col-span-7 grid grid-cols-3 gap-4">
              <div className="rounded-2xl p-5" style={{ background: c.card, border: `1px solid ${c.border}` }}>
                <MetricBlock label="Win rate" value="64%" sub="vs 58% last month" />
              </div>
              <div className="rounded-2xl p-5" style={{ background: c.card, border: `1px solid ${c.border}` }}>
                <MetricBlock label="Avg deal" value="$33K" sub="+12% vs last month" />
              </div>
              <div className="rounded-2xl p-5" style={{ background: c.card, border: `1px solid ${c.border}` }}>
                <MetricBlock label="Avg response" value="3.2d" sub="Time to first view" />
              </div>
            </div>
          </div>

          {/* ─── Main Grid ─── */}
          <div className="grid grid-cols-12 gap-6">

            {/* ─── Left: Proposals (the core) ─── */}
            <div className="col-span-8">
              
              {/* Quick actions — minimal, inline */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] mr-2" style={{ color: c.textMuted }}>Quick</span>
                {[
                  { label: "New proposal", emoji: "+" },
                  { label: "From package", emoji: "◇" },
                  { label: "Repeat for client", emoji: "↺" },
                ].map((action, i) => (
                  <button key={i}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all duration-150 hover:-translate-y-px"
                    style={{ background: c.card, border: `1px solid ${c.border}`, color: c.textSecondary, fontWeight: 450 }}>
                    <span style={{ opacity: 0.5 }}>{action.emoji}</span>
                    {action.label}
                  </button>
                ))}
              </div>

              {/* Proposal list */}
              <div className="rounded-2xl overflow-hidden" style={{ background: c.card, border: `1px solid ${c.border}` }}>
                
                {/* List header */}
                <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${c.borderSoft}` }}>
                  <span className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: c.textMuted }}>Recent proposals</span>
                  <a href="#" className="text-[11px] font-medium" style={{ color: c.brandText }}>View all →</a>
                </div>

                {/* Proposal rows */}
                {proposals.map((p, i) => {
                  const status = statusMap[p.status];
                  return (
                    <div key={p.id}
                      className="group flex items-center gap-4 px-5 py-4 transition-all duration-150 cursor-pointer hover:bg-black/[0.015]"
                      style={{ borderBottom: i < proposals.length - 1 ? `1px solid ${c.borderSoft}` : "none" }}>
                      
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-semibold"
                        style={{ background: c.bg, color: c.textSecondary }}>
                        {p.initials}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium" style={{ color: c.text }}>{p.client}</span>
                          <span className="text-[11px] font-mono" style={{ color: c.textMuted }}>{p.ref}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[12px]" style={{ color: c.textSecondary }}>{p.title}</span>
                        </div>
                      </div>

                      {/* Status dot + label */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: status.dot }} />
                        <span className="text-[11px] font-medium" style={{ color: status.dot }}>{status.label}</span>
                      </div>

                      {/* Value */}
                      <div className="text-right shrink-0 w-24">
                        <p className="text-[14px] font-semibold tabular-nums" style={{ color: c.text }}>{p.value}</p>
                        <p className="text-[10px]" style={{ color: c.textMuted }}>{p.note}</p>
                      </div>

                      {/* Time */}
                      <span className="text-[11px] shrink-0 w-12 text-right" style={{ color: c.textMuted }}>{p.time}</span>

                      {/* Hover arrow */}
                      <span className="text-[14px] opacity-0 group-hover:opacity-40 transition-opacity shrink-0" style={{ color: c.textSecondary }}>→</span>
                    </div>
                  );
                })}
              </div>

              {/* Service quick select */}
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: c.textMuted }}>Services</span>
                  {selectedServices.length > 0 && (
                    <button className="ml-auto text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors"
                      style={{ background: c.brand, color: "white" }}>
                      Create with {selectedServices.length} →
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Brand Identity", "Website Design", "SEO Strategy", "Paid Search", "Social Media", "Content Strategy"].map(s => {
                    const sel = selectedServices.includes(s);
                    return (
                      <button key={s}
                        onClick={() => setSelectedServices(prev => sel ? prev.filter(x => x !== s) : [...prev, s])}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150"
                        style={{
                          background: sel ? c.dark : c.card,
                          color: sel ? "white" : c.textSecondary,
                          border: `1px solid ${sel ? c.dark : c.border}`,
                        }}>
                        {sel ? "✓ " : ""}{s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ─── Right: Context ─── */}
            <div className="col-span-4 space-y-5">

              {/* Activity */}
              <div className="rounded-2xl p-5" style={{ background: c.card, border: `1px solid ${c.border}` }}>
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] mb-4" style={{ color: c.textMuted }}>Activity</p>
                <div className="space-y-3">
                  {activity.map((a, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="mt-1.5 shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: a.dot }} />
                      </div>
                      <div>
                        <p className="text-[12px] leading-relaxed" style={{ color: c.text }}>{a.text}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: c.textMuted }}>{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top services */}
              <div className="rounded-2xl p-5" style={{ background: c.card, border: `1px solid ${c.border}` }}>
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] mb-4" style={{ color: c.textMuted }}>Top services</p>
                <div className="space-y-3">
                  {topServices.map((s, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-medium" style={{ color: c.text }}>{s.name}</span>
                        <span className="text-[11px] tabular-nums" style={{ color: c.textMuted }}>{s.count} proposals</span>
                      </div>
                      <div className="h-1 rounded-full" style={{ background: c.borderSoft }}>
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${s.pct}%`, background: i === 0 ? c.dark : c.textMuted, opacity: i === 0 ? 1 : 0.4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insight card */}
              <div className="rounded-2xl p-5" style={{ background: c.dark }}>
                <p className="text-[10px] font-medium uppercase tracking-[0.1em] mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>Insight</p>
                <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
                  Proposals with <span className="font-semibold text-white">Brand Identity</span> have a{" "}
                  <span className="font-semibold text-white">78% win rate</span> — your strongest service. Consider leading with it.
                </p>
                <button className="mt-3 text-[11px] font-medium" style={{ color: c.brand }}>
                  Create bundle with Brand Identity →
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
