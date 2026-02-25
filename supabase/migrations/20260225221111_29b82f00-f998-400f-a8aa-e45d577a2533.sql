
-- Fix search path for the notification function
CREATE OR REPLACE FUNCTION public.notify_proposal_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency_id uuid;
  v_client_name text;
  v_title text;
  v_message text;
  v_type text;
  v_user_id uuid;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  v_agency_id := NEW.agency_id;

  SELECT company_name INTO v_client_name
  FROM clients WHERE id = NEW.client_id;

  CASE NEW.status
    WHEN 'viewed' THEN
      v_type := 'viewed';
      v_title := COALESCE(v_client_name, 'A client') || ' viewed your proposal';
      v_message := 'Proposal ' || NEW.reference_number || ' was opened';
    WHEN 'accepted' THEN
      v_type := 'accepted';
      v_title := COALESCE(v_client_name, 'A client') || ' accepted your proposal!';
      v_message := 'Proposal ' || NEW.reference_number || ' has been accepted';
    WHEN 'declined' THEN
      v_type := 'declined';
      v_title := COALESCE(v_client_name, 'A client') || ' declined your proposal';
      v_message := 'Proposal ' || NEW.reference_number || ' was declined';
    ELSE
      RETURN NEW;
  END CASE;

  v_user_id := COALESCE(
    NEW.created_by,
    (SELECT id FROM users WHERE agency_id = v_agency_id LIMIT 1)
  );

  IF v_user_id IS NOT NULL THEN
    INSERT INTO notifications (agency_id, user_id, proposal_id, type, title, message)
    VALUES (v_agency_id, v_user_id, NEW.id, v_type, v_title, v_message);
  END IF;

  RETURN NEW;
END;
$$;
