-- Trigger to auto-approve form_submissions when all approvals are complete
-- This automatically sets status = 'approved' when all form_approvals for a submission are approved

CREATE OR REPLACE FUNCTION check_and_approve_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the approval was just approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Check if ALL approvals for this submission are now approved
    IF NOT EXISTS (
      SELECT 1
      FROM form_approvals
      WHERE form_submission_id = NEW.form_submission_id
        AND status != 'approved'
    ) THEN
      -- All approvals are approved, update the submission
      UPDATE form_submissions
      SET 
        status = 'approved',
        completed_at = NOW()
      WHERE id = NEW.form_submission_id
        AND status != 'approved'; -- Only update if not already approved
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_approve_submission_trigger ON form_approvals;

-- Create the trigger
CREATE TRIGGER auto_approve_submission_trigger
  AFTER UPDATE ON form_approvals
  FOR EACH ROW
  EXECUTE FUNCTION check_and_approve_submission();

-- Also create a trigger for INSERT (in case approvals are pre-approved)
CREATE OR REPLACE TRIGGER auto_approve_submission_on_insert_trigger
  AFTER INSERT ON form_approvals
  FOR EACH ROW
  EXECUTE FUNCTION check_and_approve_submission();
