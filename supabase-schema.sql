-- ==========================================================================
-- WanderWords Passenger Database Schema (Supabase PostgreSQL)
-- Paste this into your Supabase Dashboard -> SQL Editor and click RUN
-- ==========================================================================

-- 1. Create a table for public passenger profiles
CREATE TABLE IF NOT EXISTS public.passenger_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  pnr TEXT NOT NULL UNIQUE,
  origin_stop_id TEXT DEFAULT 'jaipur',
  origin_stop_name TEXT DEFAULT 'Jaipur',
  travel_class TEXT DEFAULT '1A' CHECK (travel_class IN ('1A', '2A', 'SL')),
  date_issued TEXT DEFAULT 'OCT 2026',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.passenger_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create security policies
-- Allow passengers to view their own profile
CREATE POLICY "Allow individual read access" 
  ON public.passenger_profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Allow passengers to insert their own profile
CREATE POLICY "Allow individual insert access" 
  ON public.passenger_profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Allow passengers to update their own profile
CREATE POLICY "Allow individual update access" 
  ON public.passenger_profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- 4. Automatically create a profile entry when a new user signs up in Auth
CREATE OR REPLACE FUNCTION public.handle_new_passenger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.passenger_profiles (
    id,
    full_name,
    email,
    pnr,
    origin_stop_id,
    origin_stop_name,
    travel_class,
    date_issued
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Distinguished Traveler'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'pnr', 'WW-1928-IN'),
    COALESCE(NEW.raw_user_meta_data->>'origin_stop_id', 'jaipur'),
    COALESCE(NEW.raw_user_meta_data->>'origin_stop_name', 'Jaipur'),
    COALESCE(NEW.raw_user_meta_data->>'travel_class', '1A'),
    COALESCE(NEW.raw_user_meta_data->>'date_issued', 'OCT 2026')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger the function on every auth.users signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_passenger();
