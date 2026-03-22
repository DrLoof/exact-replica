import { supabase } from '@/integrations/supabase/client';

/**
 * Trigger HubSpot sync for a proposal after a status change.
 * Fires and forgets — never blocks the UI or shows errors to users.
 */
export async function syncProposalToHubSpot(proposalId: string) {
  try {
    await supabase.functions.invoke('hubspot-sync-proposal', {
      body: { proposalId },
    });
  } catch {
    // Silently fail — HubSpot sync should never block Propopad actions
    console.warn('HubSpot sync failed for proposal', proposalId);
  }
}

/**
 * Export a newly created client to HubSpot if the agency has an active integration.
 */
export async function exportClientToHubSpot(clientId: string, agencyId: string) {
  try {
    await supabase.functions.invoke('hubspot-export-client', {
      body: { clientId, agencyId },
    });
  } catch {
    console.warn('HubSpot client export failed for client', clientId);
  }
}
