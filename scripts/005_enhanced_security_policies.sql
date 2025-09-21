-- Enhanced RLS policies for better security

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all reservations" ON reservations;
DROP POLICY IF EXISTS "Users can insert their own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update their own reservations" ON reservations;

-- Enhanced reservation policies
CREATE POLICY "Users can view all active reservations for scheduling"
ON reservations FOR SELECT
USING (status = 'active');

CREATE POLICY "Users can insert their own reservations only"
ON reservations FOR INSERT
WITH CHECK (auth.uid() = user_id AND status = 'active');

CREATE POLICY "Users can only cancel their own reservations"
ON reservations FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND 
  (status = 'cancelled' OR status = 'active')
);

-- Prevent deletion of reservations (audit trail)
CREATE POLICY "No deletion allowed"
ON reservations FOR DELETE
USING (false);

-- Enhanced profile policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

CREATE POLICY "Users can view their own profile only"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile only"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile only"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reservations_court_date_status 
ON reservations(court_id, date, status);

CREATE INDEX IF NOT EXISTS idx_reservations_user_status 
ON reservations(user_id, status);

-- Add constraints for data integrity
ALTER TABLE reservations 
ADD CONSTRAINT check_valid_times 
CHECK (start_time < end_time);

ALTER TABLE reservations 
ADD CONSTRAINT check_future_date 
CHECK (date >= CURRENT_DATE);
