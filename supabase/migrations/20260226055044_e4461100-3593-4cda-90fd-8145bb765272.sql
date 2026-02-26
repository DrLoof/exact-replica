
-- Seed default terms clauses for existing agencies that don't have any
-- This uses handle_new_user as a model: we modify it to also seed terms for new agencies

-- First, seed terms for existing agencies that have none
INSERT INTO terms_clauses (agency_id, title, content, display_order, is_default)
SELECT a.id, t.title, t.content, t.display_order, true
FROM agencies a
CROSS JOIN (VALUES
  ('Payment Terms', 'All fees are due according to the payment schedule outlined in the Investment section of this proposal. Invoices will be issued at each milestone and are payable within 14 days of receipt. Late payments may incur a charge of 1.5% per month on the outstanding balance. Work may be paused on accounts with payments overdue by more than 30 days. All prices quoted are exclusive of applicable taxes unless otherwise stated.', 1),
  ('Project Timeline & Milestones', 'The project timeline outlined in this proposal is an estimate based on the defined scope of work. Actual timelines may vary depending on the timely provision of client feedback, content, assets, and approvals. Delays in client deliverables may result in corresponding delays to the project schedule. We will communicate any anticipated changes to the timeline promptly and work collaboratively to minimize impact.', 2),
  ('Revision Policy', 'This proposal includes the number of revision rounds specified per deliverable. A revision is defined as a set of consolidated feedback provided at one time. Additional revision rounds beyond the included allowance will be billed at our standard hourly rate. Major changes to the agreed scope, direction, or strategy after approval may constitute new work and will be quoted separately.', 3),
  ('Intellectual Property', 'Upon receipt of full and final payment, the client will receive full ownership of all final deliverables created specifically for this project. This includes design files, code, copy, and other materials as outlined in the deliverables. The agency retains the right to use project work in portfolios, case studies, and marketing materials unless otherwise agreed in writing. Any pre-existing intellectual property, frameworks, tools, or templates used in the creation of deliverables remain the property of the agency and are licensed for the client''s use.', 4),
  ('Confidentiality', 'Both parties agree to keep confidential any proprietary or sensitive information shared during the course of this engagement. This includes but is not limited to business strategies, financial information, customer data, technical specifications, and unpublished creative work. Confidential information will not be disclosed to third parties without prior written consent. This obligation survives the termination of this agreement for a period of two years.', 5),
  ('Termination', 'Either party may terminate this agreement with written notice as specified in the notice period above. In the event of termination, the client will be invoiced for all work completed up to the termination date, plus any committed third-party costs. Any deposits or advance payments for work not yet started will be refunded within 30 days. Termination does not affect either party''s rights or obligations that accrued prior to the termination date.', 6),
  ('Liability', 'The agency''s total liability under this agreement shall not exceed the total fees paid by the client for the services. The agency shall not be liable for any indirect, incidental, consequential, or special damages arising from or related to this agreement. The agency does not guarantee specific business results, rankings, traffic levels, or conversion rates, as these are influenced by many factors beyond the agency''s control. Both parties will make reasonable efforts to resolve any disputes through good-faith negotiation before pursuing formal resolution.', 7),
  ('Governing Law', 'This agreement shall be governed by and construed in accordance with the laws of the applicable jurisdiction. Any disputes arising from this agreement shall be resolved through mediation before either party may pursue litigation.', 8)
) AS t(title, content, display_order)
WHERE NOT EXISTS (SELECT 1 FROM terms_clauses tc WHERE tc.agency_id = a.id);

-- Update handle_new_user to also seed default terms for new agencies
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_agency_id UUID;
BEGIN
  -- Create a new agency for the user
  INSERT INTO public.agencies (name, email)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) || '''s Agency',
    NEW.email
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
