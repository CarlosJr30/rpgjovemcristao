DROP FUNCTION IF EXISTS public.spend_coins(uuid, integer);
DROP FUNCTION IF EXISTS public.add_coins(uuid, integer);
DROP FUNCTION IF EXISTS public.set_active_traveler(uuid);
DROP FUNCTION IF EXISTS public.create_traveler(uuid, text, text, text, text, text, text);

DROP TRIGGER IF EXISTS wallets_set_updated_at ON public.wallets;
DROP TRIGGER IF EXISTS traveler_stats_set_updated_at ON public.traveler_stats;
DROP TRIGGER IF EXISTS travelers_set_updated_at ON public.travelers;
DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
DROP FUNCTION IF EXISTS public.set_updated_at();

DROP TABLE IF EXISTS public.equipped_items;
DROP TABLE IF EXISTS public.inventory;
DROP TABLE IF EXISTS public.wallets;
DROP TABLE IF EXISTS public.traveler_stats;
DROP TABLE IF EXISTS public.travelers;
DROP TABLE IF EXISTS public.profiles;
