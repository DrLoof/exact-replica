import { useState, useEffect, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { usePlan } from '@/hooks/usePlan';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft, Plus, X, Loader2, Users2, MoreVertical,
  Shield, ShieldCheck, User, Globe, Camera, Upload,
  Pencil, Trash2, Save, Mail, RefreshCw, XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { UpgradeModal } from '@/components/UpgradeModal';

interface TeamUser {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface TeamInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

interface TeamMember {
  name: string;
  title: string;
  photo?: string;
}

const roleBadge: Record<string, { label: string; className: string }> = {
  owner: { label: 'Owner', className: 'bg-[#FBF5EE] text-[#BE8E5E]' },
  admin: { label: 'Admin', className: 'bg-[#F4F1EB] text-[#2A2118]' },
  member: { label: 'Member', className: 'bg-muted text-muted-foreground' },
};

const emptyForm: TeamMember = { name: '', title: '', photo: '' };

export default function SettingsTeam() {
  const { agency, userProfile } = useAuth();
  const { isOwner, isAdmin, id: currentUserId } = useUser();
  const { effectivePlan, canAddUser } = usePlan();

  // Team users (real users with accounts)
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite modal
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [sending, setSending] = useState(false);

  // Role change menu
  const [menuUserId, setMenuUserId] = useState<string | null>(null);

  // Upgrade modal
  const [showUpgrade, setShowUpgrade] = useState(false);

  // ---- Portfolio team members (existing functionality) ----
  const [members, setMembers] = useState<TeamMember[]>(() => {
    const raw = agency?.team_members;
    if (Array.isArray(raw)) return raw as TeamMember[];
    return [];
  });
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [form, setForm] = useState<TeamMember>(emptyForm);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  // Scrape
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [showScrapeModal, setShowScrapeModal] = useState(false);
  const [scrapedMembers, setScrapedMembers] = useState<TeamMember[]>([]);
  const [selectedScraped, setSelectedScraped] = useState<Set<number>>(new Set());

  const displayMembers = members.length > 0 || !agency?.team_members
    ? members
    : (Array.isArray(agency?.team_members) ? agency.team_members as TeamMember[] : []);

  useEffect(() => {
    if (agency?.id) {
      fetchTeam();
      fetchInvites();
    }
  }, [agency?.id]);

  const fetchTeam = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, email, full_name, role, avatar_url, created_at')
      .eq('agency_id', agency!.id)
      .order('created_at');
    setTeamUsers((data || []) as TeamUser[]);
    setLoading(false);
  };

  const fetchInvites = async () => {
    const { data } = await supabase
      .from('team_invites')
      .select('id, email, role, status, created_at, expires_at')
      .eq('agency_id', agency!.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    setInvites((data || []) as TeamInvite[]);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    const totalCount = teamUsers.length + invites.length;
    if (!canAddUser(totalCount)) {
      setShowInvite(false);
      setShowUpgrade(true);
      return;
    }

    setSending(true);
    const { data, error } = await supabase.functions.invoke('manage-team-invite', {
      body: {
        action: 'create-invite',
        agency_id: agency!.id,
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        invited_by: currentUserId,
      },
    });

    if (error || data?.error) {
      toast.error(data?.error || 'Failed to send invite');
    } else {
      toast.success(`Invite sent to ${inviteEmail}`);
      setShowInvite(false);
      setInviteEmail('');
      setInviteRole('member');
      fetchInvites();
    }
    setSending(false);
  };

  const handleResend = async (id: string) => {
    await supabase.functions.invoke('manage-team-invite', {
      body: { action: 'resend-invite', invite_id: id },
    });
    toast.success('Invite resent');
    fetchInvites();
  };

  const handleRevoke = async (id: string) => {
    await supabase.functions.invoke('manage-team-invite', {
      body: { action: 'revoke-invite', invite_id: id },
    });
    toast.success('Invite revoked');
    fetchInvites();
  };

  const handleRemoveMember = async (user: TeamUser) => {
    if (!confirm(`Remove ${user.full_name || user.email} from the team? They'll lose access immediately.`)) return;
    const { data, error } = await supabase.functions.invoke('manage-team-invite', {
      body: { action: 'remove-member', user_id: user.id, agency_id: agency!.id },
    });
    if (data?.error) {
      toast.error(data.error);
    } else {
      toast.success('Member removed');
      fetchTeam();
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    const { data } = await supabase.functions.invoke('manage-team-invite', {
      body: { action: 'change-role', user_id: userId, new_role: newRole, requester_id: currentUserId },
    });
    if (data?.error) {
      toast.error(data.error);
    } else {
      toast.success('Role updated');
      fetchTeam();
    }
    setMenuUserId(null);
  };

  // ---- Portfolio team member functions ----
  const persistMembers = async (updated: TeamMember[]) => {
    if (!agency) return;
    await supabase.from('agencies').update({ team_members: updated as any }).eq('id', agency.id);
    setMembers(updated);
  };

  const openCreate = () => {
    setForm(emptyForm); setEditIndex(null); setPhotoFile(null); setPhotoPreview(null); setShowMemberModal(true);
  };

  const openEdit = (idx: number) => {
    const m = displayMembers[idx];
    setForm({ ...m }); setEditIndex(idx); setPhotoFile(null); setPhotoPreview(m.photo || null); setShowMemberModal(true);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveMember = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    let photoUrl = form.photo || '';
    if (photoFile && agency) {
      const ext = photoFile.name.split('.').pop() || 'jpg';
      const path = `${agency.id}/team/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('agency-logos').upload(path, photoFile, { upsert: true });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('agency-logos').getPublicUrl(path);
        photoUrl = urlData.publicUrl + '?t=' + Date.now();
      }
    }
    const member: TeamMember = { name: form.name.trim(), title: form.title.trim(), photo: photoUrl };
    const updated = [...displayMembers];
    if (editIndex !== null) updated[editIndex] = member;
    else updated.push(member);
    await persistMembers(updated);
    toast.success(editIndex !== null ? 'Member updated' : 'Member added');
    setShowMemberModal(false);
    setSaving(false);
  };

  const handleDeleteMember = async (idx: number) => {
    if (!confirm(`Remove ${displayMembers[idx].name}?`)) return;
    await persistMembers(displayMembers.filter((_, i) => i !== idx));
    toast.success('Member removed');
  };

  // Scrape
  const handleScrape = async () => {
    if (!scrapeUrl.trim()) return;
    setScraping(true); setScrapedMembers([]); setSelectedScraped(new Set());
    try {
      const { data: result, error } = await supabase.functions.invoke('scrape-website', { body: { url: scrapeUrl } });
      if (error || result?.error) { toast.error(result?.error || 'Could not scrape'); setScraping(false); return; }
      const found: TeamMember[] = (result?.team_members || []).map((t: any) => ({ name: t.name || '', title: t.title || t.role || '', photo: t.photo || t.image || '' })).filter((t: TeamMember) => t.name);
      if (found.length === 0) { toast.error('No team members found'); setScraping(false); return; }
      setScrapedMembers(found);
      setSelectedScraped(new Set(found.map((_, i) => i)));
      toast.success(`Found ${found.length} member${found.length > 1 ? 's' : ''}`);
    } catch { toast.error('Failed to scrape'); }
    setScraping(false);
  };

  const toggleScraped = (idx: number) => {
    setSelectedScraped(prev => { const next = new Set(prev); if (next.has(idx)) next.delete(idx); else next.add(idx); return next; });
  };

  const rehostPhoto = async (url: string, index: number): Promise<string> => {
    if (!url || !agency) return url;
    try {
      const res = await fetch(url); if (!res.ok) return url;
      const blob = await res.blob();
      const ext = url.split('.').pop()?.split('?')[0]?.match(/^(jpg|jpeg|png|webp|gif|svg)$/i)?.[0] || 'jpg';
      const path = `${agency.id}/team/${Date.now()}-${index}.${ext}`;
      const { error } = await supabase.storage.from('agency-logos').upload(path, blob, { upsert: true, contentType: blob.type || 'image/jpeg' });
      if (error) return url;
      const { data: urlData } = supabase.storage.from('agency-logos').getPublicUrl(path);
      return urlData.publicUrl;
    } catch { return url; }
  };

  const importScraped = async () => {
    const toImport = scrapedMembers.filter((_, i) => selectedScraped.has(i));
    if (toImport.length === 0) return;
    setSaving(true);
    const existingNames = new Set(displayMembers.map(m => m.name.toLowerCase()));
    const newMembers = toImport.filter(m => !existingNames.has(m.name.toLowerCase()));
    const rehosted = await Promise.all(newMembers.map(async (m, i) => ({ ...m, photo: m.photo ? await rehostPhoto(m.photo, i) : '' })));
    await persistMembers([...displayMembers, ...rehosted]);
    toast.success(`Added ${rehosted.length} member${rehosted.length !== 1 ? 's' : ''}`);
    setShowScrapeModal(false); setScrapedMembers([]); setSaving(false);
  };

  const inputCls = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

  const maxUsers = effectivePlan?.max_users;
  const userCountLabel = maxUsers ? `${teamUsers.length} of ${maxUsers} members` : `${teamUsers.length} member${teamUsers.length !== 1 ? 's' : ''}`;

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return email[0].toUpperCase();
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    return `${days}d ago`;
  };

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Team</h1>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {userCountLabel}
          </span>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              const totalCount = teamUsers.length + invites.length;
              if (!canAddUser(totalCount)) { setShowUpgrade(true); return; }
              setShowInvite(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-ivory hover:opacity-90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Invite member
          </button>
        )}
      </div>

      {/* === TEAM USERS (accounts) === */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          {teamUsers.map((u) => {
            const badge = roleBadge[u.role || 'member'] || roleBadge.member;
            const isCurrentUser = u.id === currentUserId;
            return (
              <div key={u.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground overflow-hidden">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    getInitials(u.full_name, u.email)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">{u.full_name || u.email.split('@')[0]}</p>
                    {isCurrentUser && <span className="text-xs text-muted-foreground">← You</span>}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Joined {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', badge.className)}>
                  {badge.label}
                </span>
                {/* Actions menu */}
                {isAdmin && !isCurrentUser && u.role !== 'owner' && (
                  <div className="relative">
                    <button
                      onClick={() => setMenuUserId(menuUserId === u.id ? null : u.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuUserId === u.id && (
                      <div className="absolute right-0 top-10 z-20 w-48 rounded-xl border border-border bg-card py-1 shadow-lg">
                        <p className="px-3 py-1.5 text-[10px] font-semibold uppercase text-muted-foreground">Change role</p>
                        {isOwner && u.role !== 'owner' && (
                          <button onClick={() => handleChangeRole(u.id, 'owner')} className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted">
                            <ShieldCheck className="h-3.5 w-3.5" /> Transfer Ownership
                          </button>
                        )}
                        {u.role !== 'admin' && (
                          <button onClick={() => handleChangeRole(u.id, 'admin')} className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted">
                            <Shield className="h-3.5 w-3.5" /> Make Admin
                          </button>
                        )}
                        {u.role !== 'member' && (
                          <button onClick={() => handleChangeRole(u.id, 'member')} className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted">
                            <User className="h-3.5 w-3.5" /> Make Member
                          </button>
                        )}
                        <div className="my-1 border-t border-border" />
                        <button
                          onClick={() => { setMenuUserId(null); handleRemoveMember(u); }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove from team
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* === PENDING INVITES === */}
      {invites.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending Invites</p>
          <div className="space-y-2">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 rounded-xl border border-dashed border-border bg-card/50 px-4 py-3">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm text-foreground">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {(roleBadge[inv.role] || roleBadge.member).label} · Sent {timeAgo(inv.created_at)}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleResend(inv.id)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
                      <RefreshCw className="h-3 w-3" /> Resend
                    </button>
                    <button onClick={() => handleRevoke(inv.id)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-destructive">
                      <XCircle className="h-3 w-3" /> Revoke
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === PROPOSAL TEAM MEMBERS (portfolio display) === */}
      <div className="mt-12 border-t border-border pt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Proposal Team Members</h2>
            <p className="text-sm text-muted-foreground">These members appear in your proposals. Separate from account access above.</p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setScrapeUrl(agency?.website || ''); setShowScrapeModal(true); setScrapedMembers([]); }}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Globe className="h-4 w-4" /> Scan Website
              </button>
              <button onClick={openCreate} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                <Plus className="h-4 w-4" /> Add Member
              </button>
            </div>
          )}
        </div>

        {displayMembers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <Users2 className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">No proposal team members yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Add your team so they appear in proposals</p>
            {isAdmin && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button onClick={() => { setScrapeUrl(agency?.website || ''); setShowScrapeModal(true); setScrapedMembers([]); }} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
                  <Globe className="h-4 w-4" /> Scan Website
                </button>
                <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-ivory hover:opacity-90">
                  <Plus className="h-4 w-4" /> Add Manually
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {displayMembers.map((m, idx) => (
              <div key={idx} className="group relative flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted overflow-hidden text-sm font-bold text-muted-foreground">
                  {m.photo ? <img src={m.photo} alt={m.name} className="h-full w-full object-cover" /> : m.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{m.name}</p>
                  {m.title && <p className="truncate text-xs text-muted-foreground">{m.title}</p>}
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(idx)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDeleteMember(idx)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm" onClick={() => setShowInvite(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-foreground">Invite a team member</h3>
              <button onClick={() => setShowInvite(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email address *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colleague@agency.com"
                  className={inputCls}
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Role</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  className={inputCls}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  {inviteRole === 'admin'
                    ? 'Admins can manage services, bundles, packages, and invite team members.'
                    : 'Members can create and edit proposals and clients.'}
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={() => setShowInvite(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button
                onClick={handleInvite}
                disabled={sending || !inviteEmail.trim()}
                className="flex items-center gap-2 rounded-lg bg-ink px-5 py-2 text-sm font-medium text-ivory hover:opacity-90 disabled:opacity-50"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {sending ? 'Sending...' : 'Send invite'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Proposal Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm" onClick={() => setShowMemberModal(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-foreground">{editIndex !== null ? 'Edit Member' : 'Add Team Member'}</h3>
              <button onClick={() => setShowMemberModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden cursor-pointer group border-2 border-dashed border-border hover:border-brand transition-colors flex items-center justify-center bg-muted" onClick={() => photoRef.current?.click()}>
                  <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                  {photoPreview ? <img src={photoPreview} alt="Photo" className="w-full h-full object-cover" /> : <Camera className="h-5 w-5 text-muted-foreground" />}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Upload className="h-4 w-4 text-white" /></div>
                </div>
                <span className="text-xs text-muted-foreground">Click to upload a photo</span>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Alex Johnson" className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Title / Role</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Creative Director" className={inputCls} />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={() => setShowMemberModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={handleSaveMember} disabled={saving || !form.name.trim()} className="flex items-center gap-2 rounded-lg bg-ink px-5 py-2 text-sm font-medium text-ivory hover:opacity-90 disabled:opacity-50">
                <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scrape Modal */}
      {showScrapeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm" onClick={() => setShowScrapeModal(false)}>
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-foreground">Scan Website for Team</h3>
              <button onClick={() => setShowScrapeModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            {scrapedMembers.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Enter your website URL and we'll find team members automatically.</p>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="url" value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleScrape()} placeholder="youragency.com" className={`${inputCls} pl-10`} />
                </div>
                <button onClick={handleScrape} disabled={scraping || !scrapeUrl.trim()} className="w-full flex items-center justify-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-ivory hover:opacity-90 disabled:opacity-50">
                  {scraping ? <><Loader2 className="h-4 w-4 animate-spin" /> Scanning...</> : <><Globe className="h-4 w-4" /> Scan</>}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Found {scrapedMembers.length} team members. Select who to import:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {scrapedMembers.map((m, i) => (
                    <label key={i} className={cn('flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors', selectedScraped.has(i) ? 'border-brand bg-brand/5' : 'border-border')}>
                      <input type="checkbox" checked={selectedScraped.has(i)} onChange={() => toggleScraped(i)} className="rounded border-border" />
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted overflow-hidden text-xs font-bold text-muted-foreground">
                        {m.photo ? <img src={m.photo} alt="" className="h-full w-full object-cover" /> : m.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div><p className="text-sm font-medium text-foreground">{m.name}</p>{m.title && <p className="text-xs text-muted-foreground">{m.title}</p>}</div>
                    </label>
                  ))}
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button onClick={() => { setShowScrapeModal(false); setScrapedMembers([]); }} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                  <button onClick={importScraped} disabled={saving || selectedScraped.size === 0} className="flex items-center gap-2 rounded-lg bg-ink px-5 py-2 text-sm font-medium text-ivory hover:opacity-90 disabled:opacity-50">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {saving ? 'Importing...' : `Import ${selectedScraped.size}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgrade && (
        <UpgradeModal
          open={showUpgrade}
          onOpenChange={setShowUpgrade}
          feature="users"
        />
      )}
    </AppShell>
  );
}
