-- Additive only: existing users, avatars and progress caches are preserved.
-- This is player checkpoint data, never server authorization or reward authority.
alter table public.travelers
  add column if not exists journey_progress jsonb;
alter table public.travelers
  add constraint travelers_journey_progress_object_check
  check (journey_progress is null or
    (jsonb_typeof(journey_progress) = 'object' and
     octet_length(journey_progress::text) <= 131072));
-- Existing SELECT/INSERT/UPDATE ownership RLS also protects this column.
