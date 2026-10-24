-- Persistent business conflicts must not signal serialization_failure (40001).
-- PostgREST retries that transient SQLSTATE. PT409 preserves HTTP conflict semantics.
-- No Auth, ownership, economic rules, data or grants are changed.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DO $migration$
DECLARE signature text; definition text; expected integer; occurrences integer;
BEGIN
 IF public.economy_protocol_version() IS DISTINCT FROM 3 THEN
  RAISE EXCEPTION 'Protocol 3 required';
 END IF;
 FOR signature,expected IN SELECT * FROM (VALUES
  ('economy_private.set_owned_equipment(uuid,text,text,text)',2),
  ('public.arena_authority_v3(uuid,uuid,text,jsonb)',5)
 ) AS targets(signature,expected) LOOP
  definition := pg_get_functiondef(signature::regprocedure);
  occurrences := (length(definition)-length(replace(definition,'''40001''','')))/7;
  IF occurrences <> expected THEN RAISE EXCEPTION 'Unexpected conflict baseline: %',signature; END IF;
  EXECUTE replace(definition,'''40001''','''PT409''');
 END LOOP;
END $migration$;
