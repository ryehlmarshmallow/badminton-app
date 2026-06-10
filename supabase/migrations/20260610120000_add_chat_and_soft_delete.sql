-- Add deleted_at to rooms table
ALTER TABLE public.rooms ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create messages table
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Select policy: Allow authenticated users to view chat history
CREATE POLICY "Allow authenticated users to select messages" ON public.messages
    FOR SELECT TO authenticated USING (true);

-- Insert policy: Allow users to send messages only if they are currently in the room's player registry and the room is active
CREATE POLICY "Allow joined players to insert messages in active rooms" ON public.messages
    FOR INSERT TO authenticated 
    WITH CHECK (
        auth.uid() = profile_id 
        AND EXISTS (
            SELECT 1 FROM public.rooms
            WHERE id = room_id 
              AND auth.uid() = ANY(player_registry)
              AND deleted_at IS NULL
        )
    );

-- Enable realtime for the messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
