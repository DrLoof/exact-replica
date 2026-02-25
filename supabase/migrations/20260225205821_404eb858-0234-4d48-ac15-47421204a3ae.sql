
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications" ON public.notifications
  FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE id = auth.uid()));

-- Create proposal_shares table
CREATE TABLE public.proposal_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE,
  share_id TEXT UNIQUE NOT NULL,
  share_type TEXT DEFAULT 'link',
  recipient_email TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.proposal_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own agency shares" ON public.proposal_shares
  FOR ALL USING (proposal_id IN (
    SELECT id FROM public.proposals WHERE agency_id IN (
      SELECT agency_id FROM public.users WHERE id = auth.uid()
    )
  ));

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
