
-- 1. Plans reference table
CREATE TABLE plans (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  monthly_price   INTEGER NOT NULL,
  annual_price    INTEGER NOT NULL,
  max_users       INTEGER,
  max_proposals   INTEGER,
  max_clients     INTEGER,
  max_bundles     INTEGER,
  max_packages    INTEGER,
  features        JSONB NOT NULL,
  display_order   INTEGER DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 2. Seed plans
INSERT INTO plans (id, name, monthly_price, annual_price, max_users, max_proposals, max_clients, max_bundles, max_packages, display_order, features)
VALUES
(
  'free', 'Free', 0, 0, 1, 1, 1, 0, 0, 0,
  '{"pdf_export":false,"e_signature":false,"interactive_proposals":false,"proposal_tracking":false,"full_dashboard":false,"full_analytics":false,"color_customizer":false,"portfolio_section":false,"remove_watermark":false,"custom_domain":false,"white_label":false,"follow_up_emails":false,"api_access":false,"templates":["classic"],"priority_support":false}'
),
(
  'starter', 'Starter', 2900, 1900, 2, 10, 10, 3, 3, 1,
  '{"pdf_export":true,"e_signature":true,"interactive_proposals":false,"proposal_tracking":"basic","full_dashboard":false,"full_analytics":false,"color_customizer":true,"portfolio_section":false,"remove_watermark":true,"custom_domain":false,"white_label":false,"follow_up_emails":"basic","api_access":false,"templates":["classic","+1_premium"],"priority_support":false}'
),
(
  'pro', 'Pro', 5900, 3900, 5, 40, 50, null, null, 2,
  '{"pdf_export":true,"e_signature":true,"interactive_proposals":true,"proposal_tracking":"full","full_dashboard":true,"full_analytics":true,"color_customizer":true,"portfolio_section":true,"remove_watermark":true,"custom_domain":true,"white_label":false,"follow_up_emails":"all","api_access":false,"templates":["all"],"priority_support":true}'
),
(
  'business', 'Business', 9900, 6900, null, null, null, null, null, 3,
  '{"pdf_export":true,"e_signature":true,"interactive_proposals":true,"proposal_tracking":"full","full_dashboard":true,"full_analytics":true,"color_customizer":true,"portfolio_section":true,"remove_watermark":true,"custom_domain":true,"white_label":true,"follow_up_emails":"all_plus_custom","api_access":true,"templates":["all_plus_custom"],"priority_support":true}'
);

-- 3. Subscriptions table
CREATE TABLE subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id               UUID REFERENCES agencies(id) ON DELETE CASCADE,
  plan_id                 TEXT REFERENCES plans(id) NOT NULL DEFAULT 'free',
  billing_cycle           TEXT NOT NULL DEFAULT 'monthly',
  status                  TEXT NOT NULL DEFAULT 'active',
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  trial_ends_at           TIMESTAMPTZ,
  canceled_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

-- 4. Add plan columns to agencies
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS plan_id TEXT REFERENCES plans(id) DEFAULT 'free';
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS selected_premium_template TEXT;

-- 5. RLS for plans
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are viewable by all" ON plans FOR SELECT TO public USING (true);

-- 6. RLS for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own agency subscription"
  ON subscriptions FOR SELECT TO authenticated
  USING (agency_id IN (SELECT agency_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL TO service_role USING (true);

-- 7. Update handle_new_user to set pro trial
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_agency_id UUID;
BEGIN
  -- Create a new agency for the user with Pro trial
  INSERT INTO public.agencies (name, email, plan_id, trial_ends_at)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) || '''s Agency',
    NEW.email,
    'pro',
    now() + interval '14 days'
  )
  RETURNING id INTO new_agency_id;

  -- Create user profile
  INSERT INTO public.users (id, agency_id, email, full_name, role)
  VALUES (
    NEW.id,
    new_agency_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'owner'
  );

  -- Create trial subscription
  INSERT INTO public.subscriptions (agency_id, plan_id, status, trial_ends_at)
  VALUES (new_agency_id, 'pro', 'trialing', now() + interval '14 days');

  -- Seed default terms clauses
  INSERT INTO terms_clauses (agency_id, title, content, display_order, is_default) VALUES
    (new_agency_id, 'Payment Terms', 'All fees are due according to the payment schedule outlined in the Investment section of this proposal. Invoices will be issued at each milestone and are payable within 14 days of receipt. Late payments may incur a charge of 1.5% per month on the outstanding balance. Work may be paused on accounts with payments overdue by more than 30 days. All prices quoted are exclusive of applicable taxes unless otherwise stated.', 1, true),
    (new_agency_id, 'Project Timeline & Milestones', 'The project timeline outlined in this proposal is an estimate based on the defined scope of work. Actual timelines may vary depending on the timely provision of client feedback, content, assets, and approvals. Delays in client deliverables may result in corresponding delays to the project schedule. We will communicate any anticipated changes to the timeline promptly and work collaboratively to minimize impact.', 2, true),
    (new_agency_id, 'Revision Policy', 'This proposal includes the number of revision rounds specified per deliverable. A revision is defined as a set of consolidated feedback provided at one time. Additional revision rounds beyond the included allowance will be billed at our standard hourly rate. Major changes to the agreed scope, direction, or strategy after approval may constitute new work and will be quoted separately.', 3, true),
    (new_agency_id, 'Intellectual Property', 'Upon receipt of full and final payment, the client will receive full ownership of all final deliverables created specifically for this project. This includes design files, code, copy, and other materials as outlined in the deliverables. The agency retains the right to use project work in portfolios, case studies, and marketing materials unless otherwise agreed in writing. Any pre-existing intellectual property, frameworks, tools, or templates used in the creation of deliverables remain the property of the agency and are licensed for the client''s use.', 4, true),
    (new_agency_id, 'Confidentiality', 'Both parties agree to keep confidential any proprietary or sensitive information shared during the course of this engagement. This includes but is not limited to business strategies, financial information, customer data, technical specifications, and unpublished creative work. Confidential information will not be disclosed to third parties without prior written consent. This obligation survives the termination of this agreement for a period of two years.', 5, true),
    (new_agency_id, 'Termination', 'Either party may terminate this agreement with written notice as specified in the notice period above. In the event of termination, the client will be invoiced for all work completed up to the termination date, plus any committed third-party costs. Any deposits or advance payments for work not yet started will be refunded within 30 days. Termination does not affect either party''s rights or obligations that accrued prior to the termination date.', 6, true),
    (new_agency_id, 'Liability', 'The agency''s total liability under this agreement shall not exceed the total fees paid by the client for the services. The agency shall not be liable for any indirect, incidental, consequential, or special damages arising from or related to this agreement. The agency does not guarantee specific business results, rankings, traffic levels, or conversion rates, as these are influenced by many factors beyond the agency''s control. Both parties will make reasonable efforts to resolve any disputes through good-faith negotiation before pursuing formal resolution.', 7, true),
    (new_agency_id, 'Governing Law', 'This agreement shall be governed by and construed in accordance with the laws of the applicable jurisdiction. Any disputes arising from this agreement shall be resolved through mediation before either party may pursue litigation.', 8, true);

  RETURN NEW;
END;
$function$;
