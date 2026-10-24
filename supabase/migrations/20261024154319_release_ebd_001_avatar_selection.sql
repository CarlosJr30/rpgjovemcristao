-- Existing set_active_traveler is SECURITY INVOKER and requires this column grant.
-- Existing own-traveler RLS remains in force; XP, level and user_id remain denied.
GRANT UPDATE(is_active) ON public.travelers TO authenticated;
NOTIFY pgrst,'reload schema';
