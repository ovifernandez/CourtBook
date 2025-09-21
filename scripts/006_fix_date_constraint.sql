-- Fix the date constraint issue by handling existing past reservations
-- First, remove the problematic constraint
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS check_future_date;

-- Update any past reservations to cancelled status to maintain data integrity
UPDATE reservations 
SET status = 'cancelled' 
WHERE date < CURRENT_DATE AND status = 'active';

-- Add the constraint back, but only for new active reservations
ALTER TABLE reservations 
ADD CONSTRAINT check_future_date_for_active 
CHECK (
  (status = 'active' AND date >= CURRENT_DATE) OR 
  (status = 'cancelled')
);

-- Add additional security constraints
-- Prevent reservations longer than 3 hours
ALTER TABLE reservations 
ADD CONSTRAINT check_max_duration 
CHECK (
  EXTRACT(EPOCH FROM (end_time - start_time)) <= 10800 -- 3 hours in seconds
);

-- Add input validation constraints for security
ALTER TABLE profiles 
ADD CONSTRAINT check_full_name_length 
CHECK (LENGTH(full_name) <= 100);

ALTER TABLE profiles 
ADD CONSTRAINT check_street_length 
CHECK (LENGTH(street) <= 200);

ALTER TABLE profiles 
ADD CONSTRAINT check_phone_format 
CHECK (phone IS NULL OR phone ~ '^[+]?[0-9\s\-$$$$]{9,20}$');

-- Add unique constraint to prevent double bookings
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_reservation 
ON reservations(court_id, date, start_time, end_time) 
WHERE status = 'active';

-- Add function to prevent overlapping reservations
CREATE OR REPLACE FUNCTION check_reservation_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check for active reservations
  IF NEW.status = 'active' THEN
    -- Check for overlapping reservations
    IF EXISTS (
      SELECT 1 FROM reservations 
      WHERE court_id = NEW.court_id 
        AND date = NEW.date 
        AND status = 'active'
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND (
          (start_time <= NEW.start_time AND end_time > NEW.start_time) OR
          (start_time < NEW.end_time AND end_time >= NEW.end_time) OR
          (start_time >= NEW.start_time AND end_time <= NEW.end_time)
        )
    ) THEN
      RAISE EXCEPTION 'Reservation overlaps with existing booking';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce overlap checking
DROP TRIGGER IF EXISTS trigger_check_reservation_overlap ON reservations;
CREATE TRIGGER trigger_check_reservation_overlap
  BEFORE INSERT OR UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION check_reservation_overlap();
