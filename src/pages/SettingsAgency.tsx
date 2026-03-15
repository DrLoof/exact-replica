import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Save, Plus, Trash2, GripVertical, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TeamMember {
  id: string;
  name: string;
  title: string;
  photo_url: string | null;
  bio: string | null;
}

export default function SettingsAgency() {
  const { agency } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', website: '',
    tagline: '', about_text: '', years_experience: '' as string,
    address_line1: '', address_line2: '', city: '', state: '', zip: '', country: '',
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (agency) {
      setForm({
        name: agency.name || '',
        email: agency.email || '',
        phone: agency.phone || '',
        website: agency.website || '',
        tagline: agency.tagline || '',
        about_text: agency.about_text || '',
        years_experience: agency.years_experience?.toString() || '',
        address_line1: agency.address_line1 || '',
        address_line2: agency.address_line2 || '',
        city: agency.city || '',
        state: agency.state || '',
        zip: agency.zip || '',
        country: agency.country || '',
      });
      const raw = (agency as any).team_members;
      if (Array.isArray(raw)) setTeamMembers(raw);
    }
  }, [agency]);

  const handleSave = async () => {
    if (!agency) return;
    setSaving(true);
    const { years_experience, ...rest } = form;
    const payload = {
      ...rest,
      years_experience: years_experience ? parseInt(years_experience, 10) : null,
      team_members: teamMembers,
    };
    const { error } = await supabase.from('agencies').update(payload as any).eq('id', agency.id);
    if (error) toast.error('Failed to save');
    else toast.success('Agency profile updated');
    setSaving(false);
  };

  const addTeamMember = () => {
    setTeamMembers(prev => [...prev, {
      id: `tm_${Date.now()}`,
      name: '',
      title: '',
      photo_url: null,
      bio: null,
    }]);
  };

  const updateMember = (id: string, field: keyof TeamMember, value: string) => {
    setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, [field]: value || null } : m));
  };

  const removeMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
  };

  const Field = ({ label, name, type = 'text', span = 1 }: { label: string; name: keyof typeof form; type?: string; span?: number }) => (
    <div className={span === 2 ? 'sm:col-span-2' : ''}>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={form[name]}
          onChange={e => setForm(prev => ({ ...prev, [name]: e.target.value }))}
          rows={3}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
      ) : (
        <input
          type={type}
          value={form[name]}
          onChange={e => setForm(prev => ({ ...prev, [name]: e.target.value }))}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
      )}
    </div>
  );

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-2xl font-bold text-foreground">Agency Profile</h1>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50">
          <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Company Details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Agency Name" name="name" />
            <Field label="Website" name="website" />
            <Field label="Email" name="email" type="email" />
            <Field label="Phone" name="phone" />
            <Field label="Tagline" name="tagline" span={2} />
            <Field label="Years of Experience" name="years_experience" />
            <div /> {/* spacer */}
            <Field label="About / Why Us" name="about_text" type="textarea" span={2} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Address</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Address Line 1" name="address_line1" span={2} />
            <Field label="Address Line 2" name="address_line2" span={2} />
            <Field label="City" name="city" />
            <Field label="State / Province" name="state" />
            <Field label="ZIP / Postal Code" name="zip" />
            <Field label="Country" name="country" />
          </div>
        </div>

        {/* Team Members Section */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Team Members</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Add team members to feature in proposals</p>
            </div>
            <button
              onClick={addTeamMember}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add Member
            </button>
          </div>

          {teamMembers.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border rounded-lg">
              <User className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No team members yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Team members will appear in the "Why Us" section of your proposals</p>
              <button onClick={addTeamMember} className="mt-3 text-xs font-medium text-brand hover:text-brand-hover">
                + Add your first team member
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-start gap-3 rounded-lg border border-border p-4 group">
                  <div className="flex items-center gap-2 pt-1">
                    <GripVertical className="h-4 w-4 text-muted-foreground/30 cursor-grab" />
                    {member.photo_url ? (
                      <img src={member.photo_url} alt={member.name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center text-brand text-xs font-bold">
                        {member.name ? member.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      placeholder="Full name"
                      value={member.name}
                      onChange={e => updateMember(member.id, 'name', e.target.value)}
                      className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none"
                    />
                    <input
                      placeholder="Job title"
                      value={member.title}
                      onChange={e => updateMember(member.id, 'title', e.target.value)}
                      className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none"
                    />
                    <input
                      placeholder="Short bio (optional)"
                      value={member.bio || ''}
                      onChange={e => updateMember(member.id, 'bio', e.target.value)}
                      className="sm:col-span-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => removeMember(member.id)}
                    className="p-1.5 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
