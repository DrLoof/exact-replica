-- Check if trigger exists, create only if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_proposal_status_change'
  ) THEN
    CREATE TRIGGER on_proposal_status_change
      AFTER UPDATE ON public.proposals
      FOR EACH ROW
      EXECUTE FUNCTION public.notify_proposal_status_change();
  END IF;
END $$;