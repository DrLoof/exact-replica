import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SettingsAgency() {
  const { agency } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', website: '',
    tagline: '', about_text: '', years_experience: '' as string,
    address_line1: '', address_line2: '', city: '', state: '', zip: '', country: '',
  });
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
    }
  }, [agency]);

  const handleSave = async () => {
    if (!agency) return;
    setSaving(true);
    const { error } = await supabase.from('agencies').update(form).eq('id', agency.id);
    if (error) toast.error('Failed to save');
    else toast.success('Agency profile updated');
    setSaving(false);
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
            <Field label="About" name="about_text" type="textarea" span={2} />
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
      </div>
    </AppShell>
  );
}
