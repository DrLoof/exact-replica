import { Proposal, Client, ProposalStatus } from '@/types';
import { formatDistanceToNow } from 'date-fns';

// Mock clients
export const mockClients: Client[] = [
  {
    id: '1', agency_id: '1', company_name: 'TechVault Inc.', contact_name: 'Sarah Chen',
    contact_email: 'sarah@techvault.com', contact_title: 'Head of Marketing',
    industry: 'Technology', website: 'techvault.com', created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: '2', agency_id: '1', company_name: 'GreenLeaf Organics', contact_name: 'James Morrison',
    contact_email: 'james@greenleaf.co', contact_title: 'CEO',
    industry: 'Retail', website: 'greenleaf.co', created_at: '2026-01-20T00:00:00Z',
  },
  {
    id: '3', agency_id: '1', company_name: 'UrbanFit Studios', contact_name: 'Maria Lopez',
    contact_email: 'maria@urbanfit.com', contact_title: 'Brand Director',
    industry: 'Healthcare', website: 'urbanfit.com', created_at: '2026-02-01T00:00:00Z',
  },
  {
    id: '4', agency_id: '1', company_name: 'Cascade Financial', contact_name: 'David Park',
    contact_email: 'david@cascadefinancial.com', contact_title: 'VP Marketing',
    industry: 'Finance', website: 'cascadefinancial.com', created_at: '2026-02-10T00:00:00Z',
  },
  {
    id: '5', agency_id: '1', company_name: 'NovaEd Learning', contact_name: 'Priya Sharma',
    contact_email: 'priya@novaed.io', contact_title: 'Growth Lead',
    industry: 'Education', website: 'novaed.io', created_at: '2026-02-18T00:00:00Z',
  },
];

// Mock proposals
export const mockProposals: Proposal[] = [
  {
    id: '1', agency_id: '1', client_id: '1', reference_number: 'VCT-2026-0047',
    title: 'Digital Growth Proposal', status: 'viewed' as ProposalStatus,
    total_fixed: 42500, total_monthly: 3500, grand_total: 42500,
    created_at: '2026-02-23T10:00:00Z', updated_at: '2026-02-23T10:00:00Z',
    viewed_at: '2026-02-24T14:30:00Z', client: mockClients[0],
  },
  {
    id: '2', agency_id: '1', client_id: '2', reference_number: 'VCT-2026-0046',
    title: 'Brand Launch Package', status: 'sent' as ProposalStatus,
    total_fixed: 28000, total_monthly: 0, grand_total: 28000,
    created_at: '2026-02-21T09:00:00Z', updated_at: '2026-02-21T09:00:00Z',
    sent_at: '2026-02-22T11:00:00Z', client: mockClients[1],
  },
  {
    id: '3', agency_id: '1', client_id: '3', reference_number: 'VCT-2026-0045',
    title: 'Social Media Strategy', status: 'accepted' as ProposalStatus,
    total_fixed: 15000, total_monthly: 4500, grand_total: 15000,
    created_at: '2026-02-18T08:00:00Z', updated_at: '2026-02-20T16:00:00Z',
    client: mockClients[2],
  },
  {
    id: '4', agency_id: '1', client_id: '4', reference_number: 'VCT-2026-0044',
    title: 'Full-Service Retainer', status: 'draft' as ProposalStatus,
    total_fixed: 0, total_monthly: 8500, grand_total: 8500,
    created_at: '2026-02-17T14:00:00Z', updated_at: '2026-02-17T14:00:00Z',
    client: mockClients[3],
  },
  {
    id: '5', agency_id: '1', client_id: '5', reference_number: 'VCT-2026-0043',
    title: 'SEO & Content Package', status: 'declined' as ProposalStatus,
    total_fixed: 22000, total_monthly: 2000, grand_total: 22000,
    created_at: '2026-02-10T10:00:00Z', updated_at: '2026-02-15T09:00:00Z',
    client: mockClients[4],
  },
];

export const mockActivityFeed = [
  { id: '1', text: 'Proposal VCT-2026-0047 was viewed by Sarah Chen', time: '2 hours ago', type: 'viewed' },
  { id: '2', text: 'Proposal VCT-2026-0045 was accepted by Maria Lopez', time: '1 day ago', type: 'accepted' },
  { id: '3', text: 'Proposal VCT-2026-0046 was sent to James Morrison', time: '2 days ago', type: 'sent' },
  { id: '4', text: 'New client Cascade Financial added', time: '3 days ago', type: 'created' },
  { id: '5', text: 'Proposal VCT-2026-0043 was declined by Priya Sharma', time: '5 days ago', type: 'declined' },
];
