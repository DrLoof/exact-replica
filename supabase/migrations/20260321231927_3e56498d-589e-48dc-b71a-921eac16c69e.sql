
-- Create proposal_signatures table
CREATE TABLE proposal_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  signer_name TEXT NOT NULL,
  signer_title TEXT,
  signer_company TEXT NOT NULL,
  signer_email TEXT,
  signature_text TEXT NOT NULL,
  signature_font TEXT DEFAULT 'Caveat',
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  consent_text TEXT NOT NULL,
  proposal_snapshot JSONB,
  proposal_hash TEXT,
  role TEXT DEFAULT 'client',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns to proposals
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS signed_pdf_url TEXT;

-- RLS: allow anonymous inserts (clients signing) and authenticated reads
ALTER TABLE proposal_signatures ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a signature (public proposal signing)
CREATE POLICY "Anyone can insert signatures"
ON proposal_signatures FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Authenticated users can read signatures for their agency's proposals
CREATE POLICY "Users can read signatures for their proposals"
ON proposal_signatures FOR SELECT
TO authenticated
USING (
  proposal_id IN (
    SELECT p.id FROM proposals p
    WHERE p.agency_id = (SELECT u.agency_id FROM users u WHERE u.id = auth.uid())
  )
);

-- Anon can read signatures for proposals they have access to via shares
CREATE POLICY "Anon can read signatures via shares"
ON proposal_signatures FOR SELECT
TO anon
USING (
  proposal_id IN (
    SELECT ps.proposal_id FROM proposal_shares ps
    WHERE ps.is_active = true
  )
);
