-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    skill_level TEXT NOT NULL CHECK (skill_level IN ('Beginner', 'Intermediate', 'Advanced')),
    balance BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Allow authenticated users to read profiles" ON public.profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow individual insert of profiles" ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow individual update of profiles" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Create rooms table
CREATE TABLE public.rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    location TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    price BIGINT NOT NULL,
    max_players INTEGER NOT NULL DEFAULT 4,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    player_registry UUID[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on rooms
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Policies for rooms
CREATE POLICY "Allow authenticated users to select rooms" ON public.rooms
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert rooms" ON public.rooms
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Allow authenticated users to update rooms" ON public.rooms
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete rooms" ON public.rooms
    FOR DELETE TO authenticated USING (auth.uid() = creator_id);
