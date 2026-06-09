-- Create courts table
CREATE TABLE public.courts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    num_fields INTEGER NOT NULL,
    working_start INTEGER NOT NULL DEFAULT 8,
    working_end INTEGER NOT NULL DEFAULT 22,
    fields_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on courts
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;

-- Policies for courts
CREATE POLICY "Allow authenticated users to select courts" ON public.courts
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow owner to insert courts" ON public.courts
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Allow owner to update courts" ON public.courts
    FOR UPDATE TO authenticated USING (auth.uid() = owner_id);

-- Alter rooms table
ALTER TABLE public.rooms ADD COLUMN court_id UUID REFERENCES public.courts(id) ON DELETE SET NULL;
ALTER TABLE public.rooms ADD COLUMN booking_date DATE;
ALTER TABLE public.rooms ADD COLUMN booking_slots JSONB DEFAULT '[]'::jsonb;
