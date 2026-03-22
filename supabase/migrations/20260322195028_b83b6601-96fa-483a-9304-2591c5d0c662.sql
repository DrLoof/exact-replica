
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  hub_id TEXT,
  settings JSONB DEFAULT '{}',
  sync_enabled BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id, provider)
);

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their agency integrations"
  ON public.integrations FOR SELECT TO authenticated
  USING (agency_id = public.get_user_agency_id(auth.uid()));

CREATE POLICY "Users can insert their agency integrations"
  ON public.integrations FOR INSERT TO authenticated
  WITH CHECK (agency_id = public.get_user_agency_id(auth.uid()));

CREATE POLICY "Users can update their agency integrations"
  ON public.integrations FOR UPDATE TO authenticated
  USING (agency_id = public.get_user_agency_id(auth.uid()));

CREATE POLICY "Users can delete their agency integrations"
  ON public.integrations FOR DELETE TO authenticated
  USING (agency_id = public.get_user_agency_id(auth.uid()));

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
