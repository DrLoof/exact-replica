// Propopad Types

export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';

export interface Agency {
  id: string;
  name: string;
  website?: string;
  logo_url?: string;
  brand_color: string;
  email?: string;
  phone?: string;
  currency: string;
  currency_symbol: string;
  proposal_prefix?: string;
  proposal_counter: number;
}

export interface User {
  id: string;
  agency_id: string;
  full_name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  avatar_url?: string;
}

export interface Client {
  id: string;
  agency_id: string;
  company_name: string;
  contact_name?: string;
  contact_email?: string;
  contact_title?: string;
  industry?: string;
  website?: string;
  logo_url?: string;
  phone?: string;
  notes?: string;
  created_at: string;
}

export interface Proposal {
  id: string;
  agency_id: string;
  client_id: string;
  reference_number: string;
  title?: string;
  subtitle?: string;
  status: ProposalStatus;
  total_fixed: number;
  total_monthly: number;
  grand_total: number;
  created_at: string;
  updated_at: string;
  sent_at?: string;
  viewed_at?: string;
  // Joined
  client?: Client;
}

export interface ServiceGroup {
  id: string;
  name: string;
  description?: string;
  icon: string;
  display_order: number;
}

export interface ServiceModule {
  id: string;
  agency_id: string;
  group_id: string;
  name: string;
  description?: string;
  short_description?: string;
  icon: string;
  pricing_model: 'fixed' | 'monthly' | 'hourly';
  price_fixed?: number;
  price_monthly?: number;
  price_hourly?: number;
  is_active: boolean;
  display_order: number;
}

export interface Bundle {
  id: string;
  agency_id: string;
  name: string;
  tagline?: string;
  bundle_price: number;
  individual_total: number;
  savings_amount: number;
  is_active: boolean;
}

export interface Differentiator {
  id: string;
  agency_id: string;
  title: string;
  description?: string;
  stat_value?: string;
  stat_label?: string;
  icon: string;
  display_order: number;
}
