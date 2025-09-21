-- Enable Row Level Security on all tables
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Courts policies - all authenticated users can read courts
CREATE POLICY "Courts are viewable by authenticated users" ON courts
  FOR SELECT USING (auth.role() = 'authenticated');

-- Reservations policies - users can only see and manage their own reservations
CREATE POLICY "Users can view their own reservations" ON reservations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reservations" ON reservations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations" ON reservations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reservations" ON reservations
  FOR DELETE USING (auth.uid() = user_id);

-- Profiles policies - users can only see and manage their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
