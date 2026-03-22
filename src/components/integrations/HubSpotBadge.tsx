import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface HubSpotBadgeProps {
  hubspotId?: string | null;
  type: 'contact' | 'deal';
  hubId?: string | null;
  lastSynced?: string | null;
}

export function HubSpotBadge({ hubspotId, type, hubId, lastSynced }: HubSpotBadgeProps) {
  if (!hubspotId) return null;

  const hubSpotUrl = type === 'contact'
    ? `https://app-eu1.hubspot.com/contacts/${hubId || ''}/contact/${hubspotId}`
    : `https://app-eu1.hubspot.com/contacts/${hubId || ''}/deal/${hubspotId}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={hubSpotUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="inline-flex items-center justify-center rounded p-0.5 transition-colors hover:bg-parchment-soft"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#FF7A59">
            <path d="M17.69 13.13c-.57 0-1.08.23-1.46.6l-2.72-1.69c.1-.33.16-.69.16-1.06 0-.31-.04-.6-.13-.88l2.73-1.72c.37.35.87.56 1.42.56 1.14 0 2.07-.93 2.07-2.07S18.83 4.8 17.69 4.8s-2.07.93-2.07 2.07c0 .18.02.35.07.51l-2.74 1.73c-.62-.72-1.54-1.18-2.57-1.18-1.87 0-3.39 1.52-3.39 3.39 0 .67.2 1.29.53 1.82L5.8 14.79c-.23-.1-.48-.15-.74-.15-.97 0-1.76.79-1.76 1.76s.79 1.76 1.76 1.76 1.76-.79 1.76-1.76c0-.22-.04-.43-.12-.62l1.73-1.67c.62.49 1.4.78 2.24.78.96 0 1.83-.38 2.47-1l2.7 1.68c-.06.18-.09.37-.09.57 0 1.14.93 2.07 2.07 2.07s2.07-.93 2.07-2.07-.93-2.07-2.07-2.07h-.13z" />
          </svg>
        </a>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs">Synced with HubSpot{lastSynced ? ` · Last updated ${lastSynced}` : ''}</p>
        <p className="text-xs text-muted-foreground">Click to open in HubSpot</p>
      </TooltipContent>
    </Tooltip>
  );
}
