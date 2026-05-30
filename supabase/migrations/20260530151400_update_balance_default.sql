-- Alter default balance for profiles to 0
ALTER TABLE public.profiles ALTER COLUMN balance SET DEFAULT 0;
