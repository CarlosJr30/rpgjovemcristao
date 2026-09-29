CREATE TABLE "equipped_items" (
	"traveler_id" uuid NOT NULL,
	"slot" text NOT NULL,
	"item_id" text NOT NULL,
	"equipped_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "equipped_items_traveler_id_slot_pk" PRIMARY KEY("traveler_id","slot"),
	CONSTRAINT "equipped_items_slot_check" CHECK ("equipped_items"."slot" in ('helmet', 'armor', 'weapon', 'shield', 'boots', 'amulet'))
);
--> statement-breakpoint
ALTER TABLE "equipped_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"traveler_id" uuid NOT NULL,
	"item_id" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"acquired_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "inventory_traveler_item_unique" UNIQUE("traveler_id","item_id"),
	CONSTRAINT "inventory_item_id_length_check" CHECK (char_length("inventory"."item_id") between 1 and 64),
	CONSTRAINT "inventory_quantity_check" CHECK ("inventory"."quantity" > 0)
);
--> statement-breakpoint
ALTER TABLE "inventory" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_display_name_length_check" CHECK ("profiles"."display_name" is null or char_length("profiles"."display_name") between 2 and 50)
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "traveler_stats" (
	"traveler_id" uuid PRIMARY KEY NOT NULL,
	"base_life" integer DEFAULT 1 NOT NULL,
	"base_strength" integer DEFAULT 1 NOT NULL,
	"base_defense" integer DEFAULT 1 NOT NULL,
	"base_wisdom" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "traveler_stats_life_check" CHECK ("traveler_stats"."base_life" >= 0),
	CONSTRAINT "traveler_stats_strength_check" CHECK ("traveler_stats"."base_strength" >= 0),
	CONSTRAINT "traveler_stats_defense_check" CHECK ("traveler_stats"."base_defense" >= 0),
	CONSTRAINT "traveler_stats_wisdom_check" CHECK ("traveler_stats"."base_wisdom" >= 0)
);
--> statement-breakpoint
ALTER TABLE "traveler_stats" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "travelers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"body_type" text NOT NULL,
	"skin_tone" text NOT NULL,
	"hair_style" text NOT NULL,
	"hair_color" text,
	"avatar_variant" text,
	"level" integer DEFAULT 1 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "travelers_name_length_check" CHECK (char_length("travelers"."name") between 2 and 24),
	CONSTRAINT "travelers_body_type_check" CHECK ("travelers"."body_type" in ('male', 'female')),
	CONSTRAINT "travelers_level_check" CHECK ("travelers"."level" >= 1),
	CONSTRAINT "travelers_xp_check" CHECK ("travelers"."xp" >= 0)
);
--> statement-breakpoint
ALTER TABLE "travelers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "wallets" (
	"traveler_id" uuid PRIMARY KEY NOT NULL,
	"coins" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallets_coins_check" CHECK ("wallets"."coins" >= 0)
);
--> statement-breakpoint
ALTER TABLE "wallets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "equipped_items" ADD CONSTRAINT "equipped_items_traveler_id_travelers_id_fk" FOREIGN KEY ("traveler_id") REFERENCES "public"."travelers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipped_items" ADD CONSTRAINT "equipped_items_owned_item_fk" FOREIGN KEY ("traveler_id","item_id") REFERENCES "public"."inventory"("traveler_id","item_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_traveler_id_travelers_id_fk" FOREIGN KEY ("traveler_id") REFERENCES "public"."travelers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traveler_stats" ADD CONSTRAINT "traveler_stats_traveler_id_travelers_id_fk" FOREIGN KEY ("traveler_id") REFERENCES "public"."travelers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travelers" ADD CONSTRAINT "travelers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_traveler_id_travelers_id_fk" FOREIGN KEY ("traveler_id") REFERENCES "public"."travelers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inventory_traveler_id_idx" ON "inventory" USING btree ("traveler_id");--> statement-breakpoint
CREATE INDEX "travelers_user_id_idx" ON "travelers" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "travelers_one_active_per_user_idx" ON "travelers" USING btree ("user_id") WHERE "travelers"."is_active" = true;--> statement-breakpoint
CREATE POLICY "equipped_items_select_own" ON "equipped_items" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
    select 1 from "travelers"
    where "travelers"."id" = "equipped_items"."traveler_id"
      and "travelers"."user_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "equipped_items_insert_own" ON "equipped_items" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
    select 1 from "travelers"
    where "travelers"."id" = "equipped_items"."traveler_id"
      and "travelers"."user_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "equipped_items_update_own" ON "equipped_items" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (
    select 1 from "travelers"
    where "travelers"."id" = "equipped_items"."traveler_id"
      and "travelers"."user_id" = (select auth.uid())
  )) WITH CHECK (exists (
    select 1 from "travelers"
    where "travelers"."id" = "equipped_items"."traveler_id"
      and "travelers"."user_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "equipped_items_delete_own" ON "equipped_items" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (
    select 1 from "travelers"
    where "travelers"."id" = "equipped_items"."traveler_id"
      and "travelers"."user_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "inventory_select_own" ON "inventory" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
    select 1 from "travelers"
    where "travelers"."id" = "inventory"."traveler_id"
      and "travelers"."user_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "inventory_insert_own" ON "inventory" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
    select 1 from "travelers"
    where "travelers"."id" = "inventory"."traveler_id"
      and "travelers"."user_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "inventory_update_own" ON "inventory" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (
    select 1 from "travelers"
    where "travelers"."id" = "inventory"."traveler_id"
      and "travelers"."user_id" = (select auth.uid())
  )) WITH CHECK (exists (
    select 1 from "travelers"
    where "travelers"."id" = "inventory"."traveler_id"
      and "travelers"."user_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "inventory_delete_own" ON "inventory" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (
    select 1 from "travelers"
    where "travelers"."id" = "inventory"."traveler_id"
      and "travelers"."user_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "profiles_select_own" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "profiles"."id");--> statement-breakpoint
CREATE POLICY "profiles_insert_own" ON "profiles" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "profiles"."id");--> statement-breakpoint
CREATE POLICY "profiles_update_own" ON "profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "profiles"."id") WITH CHECK ((select auth.uid()) = "profiles"."id");--> statement-breakpoint
CREATE POLICY "traveler_stats_select_own" ON "traveler_stats" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
    select 1 from "travelers"
    where "travelers"."id" = "traveler_stats"."traveler_id"
      and "travelers"."user_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "traveler_stats_insert_own" ON "traveler_stats" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
    select 1 from "travelers"
    where "travelers"."id" = "traveler_stats"."traveler_id"
      and "travelers"."user_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "traveler_stats_update_own" ON "traveler_stats" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (
    select 1 from "travelers"
    where "travelers"."id" = "traveler_stats"."traveler_id"
      and "travelers"."user_id" = (select auth.uid())
  )) WITH CHECK (exists (
    select 1 from "travelers"
    where "travelers"."id" = "traveler_stats"."traveler_id"
      and "travelers"."user_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "travelers_select_own" ON "travelers" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("travelers"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "travelers_insert_own" ON "travelers" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("travelers"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "travelers_update_own" ON "travelers" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("travelers"."user_id" = (select auth.uid())) WITH CHECK ("travelers"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "travelers_delete_own" ON "travelers" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("travelers"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "wallets_select_own" ON "wallets" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
    select 1 from "travelers"
    where "travelers"."id" = "wallets"."traveler_id"
      and "travelers"."user_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "wallets_insert_own" ON "wallets" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
    select 1 from "travelers"
    where "travelers"."id" = "wallets"."traveler_id"
      and "travelers"."user_id" = (select auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "wallets_update_own" ON "wallets" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (
    select 1 from "travelers"
    where "travelers"."id" = "wallets"."traveler_id"
      and "travelers"."user_id" = (select auth.uid())
  )) WITH CHECK (exists (
    select 1 from "travelers"
    where "travelers"."id" = "wallets"."traveler_id"
      and "travelers"."user_id" = (select auth.uid())
  ));--> statement-breakpoint

REVOKE ALL ON TABLE "profiles", "travelers", "traveler_stats", "wallets", "inventory", "equipped_items" FROM "anon";--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO "authenticated";--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "profiles" TO "authenticated";--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "travelers" TO "authenticated";--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "traveler_stats", "wallets" TO "authenticated";--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "inventory", "equipped_items" TO "authenticated";--> statement-breakpoint

CREATE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;--> statement-breakpoint

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER travelers_set_updated_at
BEFORE UPDATE ON public.travelers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER traveler_stats_set_updated_at
BEFORE UPDATE ON public.traveler_stats
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER wallets_set_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, "anon", "authenticated";--> statement-breakpoint

CREATE FUNCTION public.create_traveler(
  p_id uuid,
  p_name text,
  p_body_type text,
  p_skin_tone text,
  p_hair_style text,
  p_hair_color text,
  p_avatar_variant text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.travelers
  SET is_active = false
  WHERE user_id = current_user_id AND is_active = true;

  INSERT INTO public.travelers (
    id, user_id, name, body_type, skin_tone, hair_style,
    hair_color, avatar_variant, level, xp, is_active
  ) VALUES (
    p_id, current_user_id, p_name, p_body_type, p_skin_tone, p_hair_style,
    p_hair_color, p_avatar_variant, 1, 0, true
  );

  INSERT INTO public.traveler_stats (traveler_id) VALUES (p_id);
  INSERT INTO public.wallets (traveler_id) VALUES (p_id);
  INSERT INTO public.inventory (traveler_id, item_id, quantity)
  VALUES (p_id, 'traveler-boots', 1);
  INSERT INTO public.equipped_items (traveler_id, slot, item_id)
  VALUES (p_id, 'boots', 'traveler-boots');

  RETURN p_id;
END;
$$;--> statement-breakpoint

CREATE FUNCTION public.set_active_traveler(p_traveler_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.travelers
  SET is_active = false
  WHERE user_id = auth.uid() AND is_active = true;

  UPDATE public.travelers
  SET is_active = true
  WHERE id = p_traveler_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Traveler not found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;--> statement-breakpoint

CREATE FUNCTION public.add_coins(p_traveler_id uuid, p_amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  resulting_coins integer;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive' USING ERRCODE = '22023';
  END IF;

  UPDATE public.wallets
  SET coins = coins + p_amount
  WHERE traveler_id = p_traveler_id
  RETURNING coins INTO resulting_coins;

  IF resulting_coins IS NULL THEN
    RAISE EXCEPTION 'Wallet not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN resulting_coins;
END;
$$;--> statement-breakpoint

CREATE FUNCTION public.spend_coins(p_traveler_id uuid, p_amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  resulting_coins integer;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive' USING ERRCODE = '22023';
  END IF;

  UPDATE public.wallets
  SET coins = coins - p_amount
  WHERE traveler_id = p_traveler_id AND coins >= p_amount
  RETURNING coins INTO resulting_coins;

  IF resulting_coins IS NULL THEN
    RAISE EXCEPTION 'Insufficient balance or wallet not found' USING ERRCODE = 'P0001';
  END IF;

  RETURN resulting_coins;
END;
$$;--> statement-breakpoint

REVOKE ALL ON FUNCTION public.create_traveler(uuid, text, text, text, text, text, text) FROM PUBLIC, "anon";--> statement-breakpoint
REVOKE ALL ON FUNCTION public.set_active_traveler(uuid) FROM PUBLIC, "anon";--> statement-breakpoint
REVOKE ALL ON FUNCTION public.add_coins(uuid, integer) FROM PUBLIC, "anon";--> statement-breakpoint
REVOKE ALL ON FUNCTION public.spend_coins(uuid, integer) FROM PUBLIC, "anon";--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.create_traveler(uuid, text, text, text, text, text, text) TO "authenticated";--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.set_active_traveler(uuid) TO "authenticated";--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.add_coins(uuid, integer) TO "authenticated";--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.spend_coins(uuid, integer) TO "authenticated";
