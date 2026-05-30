-- Drop old policies referencing creator_id
DROP POLICY IF EXISTS "Allow authenticated users to insert rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow authenticated users to delete rooms" ON public.rooms;

-- Drop creator_id column from rooms table
ALTER TABLE public.rooms DROP COLUMN creator_id;

-- Create new policies without creator_id
CREATE POLICY "Allow authenticated users to insert rooms" ON public.rooms
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete rooms" ON public.rooms
    FOR DELETE TO authenticated USING (true);
