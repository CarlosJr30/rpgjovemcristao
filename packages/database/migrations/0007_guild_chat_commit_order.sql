-- TASK-0071: additive function correction; preserves messages and privileges.
CREATE OR REPLACE FUNCTION guild_chat_private.send(p_guild_id uuid,p_traveler_id uuid,p_client_id uuid,p_body text,p_announcement boolean)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor_role text; author public.travelers%ROWTYPE; previous public.guild_chat_messages%ROWTYPE; result_id uuid;
BEGIN
  actor_role:=guild_chat_private.actor(p_guild_id,p_traveler_id);
  IF p_body IS NULL OR char_length(btrim(p_body)) NOT BETWEEN 1 AND 1000 OR octet_length(p_body)>4000 OR p_client_id IS NULL OR p_announcement IS NULL THEN RAISE EXCEPTION 'Invalid chat message' USING ERRCODE='22023'; END IF;
  IF p_announcement AND actor_role<>'leader' THEN RAISE EXCEPTION 'Leader required' USING ERRCODE='42501'; END IF;
  -- Serialize guild insert commits so read cursors cannot skip a late commit.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_guild_id::text,63));
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text,62));
  SELECT * INTO previous FROM public.guild_chat_messages WHERE author_traveler_id=p_traveler_id AND client_id=p_client_id;
  IF FOUND THEN
    IF previous.guild_id<>p_guild_id OR previous.body IS DISTINCT FROM btrim(p_body) OR previous.is_announcement<>p_announcement THEN RAISE EXCEPTION 'Chat retry conflict' USING ERRCODE='22023'; END IF;
    RETURN previous.id;
  END IF;
  PERFORM guild_chat_private.take_rate('send');
  SELECT * INTO author FROM public.travelers WHERE id=p_traveler_id;
  INSERT INTO public.guild_chat_messages(guild_id,author_traveler_id,client_id,author_name,author_body_type,author_skin_tone,author_hair_style,author_outfit,body,is_announcement)
    VALUES(p_guild_id,p_traveler_id,p_client_id,author.name,author.body_type,author.skin_tone,author.hair_style,coalesce(author.avatar_variant,'musgo'),btrim(p_body),p_announcement) RETURNING id INTO result_id;
  RETURN result_id;
END $$;
