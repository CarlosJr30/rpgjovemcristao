-- STORY-007: LOCAL PROPOSAL ONLY. Depends on TASK-0081 story_definitions.
-- Not journaled; do not apply remotely. Checkpoints never grant economic value.
BEGIN;

CREATE TABLE story_private.creation_checkpoint_revisions (
  revision integer PRIMARY KEY CHECK (revision > 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','revoked')),
  manifest text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Versioned demo content starts as draft; RPCs cannot consume it until published.
INSERT INTO story_private.creation_checkpoint_revisions(revision,status,manifest)
VALUES (1,'draft',$creation_manifest${"revision":1,"days":[{"id":"creation-day-1","title":"Luz e trevas","reference":"Gênesis 1:3–5","passage":"1.3-5","motifs":"✦","objective":"Encontre o marco da luz para abrir o desafio.","markers":[{"label":"Marco da luz","symbol":"✦","point":{"x":72,"y":50}}],"question":"O que Deus criou no primeiro dia?","options":["A luz.","O firmamento."],"explanation":"Deus disse que houvesse luz, separou a luz das trevas e chamou a luz de Dia e as trevas de Noite.","harmonyLabel":"Luz e trevas","answer":1},{"id":"creation-day-2","title":"Firmamento","reference":"Gênesis 1:6–8","passage":"1.6-8","motifs":"☁ ≋","objective":"Encontre o marco do céu e identifique o acontecimento do segundo dia.","markers":[{"label":"Marco do céu","symbol":"☁","point":{"x":72,"y":50}}],"question":"O que o firmamento separou?","options":["A terra seca dos mares.","As águas de cima das águas de baixo."],"explanation":"O firmamento separou as águas acima e abaixo dele. Deus deu ao firmamento o nome de céu.","harmonyLabel":"Firmamento","answer":2},{"id":"creation-day-3","title":"Terra e vegetação","harmonyLabel":"Terra, mares e vegetação","reference":"Gênesis 1:9–13","passage":"1.9-13","motifs":"▲ ≋ ♧","objective":"Visite os três marcos educativos: terra, mares e vegetação.","markers":[{"label":"Terra","symbol":"▲","point":{"x":25,"y":80},"note":"A porção seca recebeu o nome de terra."},{"label":"Mares","symbol":"≋","point":{"x":72,"y":50},"note":"As águas reunidas receberam o nome de mares."},{"label":"Vegetação","symbol":"♧","point":{"x":73,"y":78},"note":"A terra fez brotar plantas e árvores que produzem sementes."}],"question":"O que acontece no terceiro dia?","options":["Aparece a terra seca, as águas se reúnem e surge vegetação.","As aves e os seres aquáticos povoam o céu e as águas."],"explanation":"O relato reúne o aparecimento da terra seca, a formação dos mares e o surgimento da vegetação.","answer":1},{"id":"creation-day-4","title":"Luminares","reference":"Gênesis 1:14–19","passage":"1.14-19","motifs":"☀ ☾ ✦","objective":"Observe o céu e encontre o marco dos luminares.","markers":[{"label":"Marco dos luminares","symbol":"☀","point":{"x":72,"y":50}}],"question":"Que funções o relato atribui aos luminares?","options":["Separar as águas acima e abaixo do céu.","Iluminar a terra, distinguir dia e noite e marcar tempos."],"explanation":"Os luminares iluminam a terra, distinguem dia e noite e servem para marcar tempos, dias e anos.","harmonyLabel":"Luminares","answer":2},{"id":"creation-day-5","title":"Aves e criaturas das águas","reference":"Gênesis 1:20–23","passage":"1.20-23","motifs":"🐦 🐟","objective":"Encontre o marco das águas e dos céus.","markers":[{"label":"Marco da vida","symbol":"≈","point":{"x":72,"y":50}}],"question":"Quais grupos aparecem no quinto dia?","options":["Seres aquáticos e aves.","Animais terrestres e seres humanos."],"explanation":"Deus criou os seres que povoam as águas e as aves que voam pelo céu.","harmonyLabel":"Aves e criaturas das águas","answer":1},{"id":"creation-day-6","title":"Animais terrestres e humanidade","reference":"Gênesis 1:24–31","passage":"1.24-31","motifs":"🐾 👥","objective":"Encontre o marco que apresenta os animais terrestres e a humanidade.","markers":[{"label":"Marco da humanidade","symbol":"◇","point":{"x":72,"y":50}}],"question":"Além dos animais terrestres, quem foi criado no sexto dia?","options":["As aves, feitas à imagem de Deus.","Os seres humanos, criados à imagem de Deus."],"explanation":"O relato apresenta os animais terrestres e ensina que Deus criou os seres humanos à sua imagem.","harmonyLabel":"Animais terrestres e humanidade","answer":2},{"id":"creation-day-7","title":"Descanso e reflexão","harmonyLabel":"Descanso do sétimo dia","reference":"Gênesis 2:1–3","passage":"2.1-3","motifs":"◌","objective":"Visite o marco do descanso. O Diário Bíblico é opcional.","markers":[{"label":"Marco do descanso","symbol":"◌","point":{"x":72,"y":50}}],"question":"Como o relato descreve o sétimo dia?","options":["Deus havia concluído sua obra, descansou e santificou o dia.","Deus começou a criar os luminares do céu."],"explanation":"Com sua obra concluída, Deus descansou. Ele abençoou e santificou o sétimo dia.","answer":1}],"harmony":["creation-day-1","creation-day-2","creation-day-3","creation-day-4","creation-day-5","creation-day-6","creation-day-7"],"quiz":[{"id":"light","question":"O que Deus criou no primeiro dia?","options":["Os animais terrestres","A luz","O sol e a lua"],"reference":"Gênesis 1:3–5","passage":"1.3-5","explanation":"A luz aparece no primeiro dia.","optionIds":["a","b","c"],"answer":2},{"id":"land","question":"Em qual dia surgiram a porção seca e a vegetação?","options":["Terceiro dia","Quinto dia","Sexto dia"],"reference":"Gênesis 1:9–13","passage":"1.9-13","explanation":"A terra seca e a vegetação aparecem no terceiro dia.","optionIds":["a","b","c"],"answer":1},{"id":"lights","question":"O que Deus estabeleceu no quarto dia?","options":["As aves e os peixes","Os animais terrestres","Os luminares"],"reference":"Gênesis 1:14–19","passage":"1.14-19","explanation":"Os luminares são apresentados no quarto dia.","optionIds":["a","b","c"],"answer":3},{"id":"image","question":"À imagem de quem Deus criou o ser humano?","options":["Dos anjos","De Deus","Dos animais"],"reference":"Gênesis 1:26–27","passage":"1.26-27","explanation":"O relato descreve o ser humano como criado à imagem de Deus.","optionIds":["a","b","c"],"answer":2},{"id":"rest","question":"O que Deus fez no sétimo dia?","options":["Criou os mares","Criou as árvores","Concluiu Sua obra, descansou e santificou o dia"],"reference":"Gênesis 2:1–3","passage":"2.1-3","explanation":"Com a obra concluída, Deus descansou e santificou o sétimo dia.","optionIds":["a","b","c"],"answer":3}]}$creation_manifest$);
CREATE FUNCTION story_private.guard_creation_revision() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    IF NEW.status<>'draft' THEN RAISE EXCEPTION 'Creation revisions must start in draft'; END IF;
    RETURN NEW;
  END IF;
  IF TG_OP='DELETE' THEN
    IF OLD.status<>'draft' THEN RAISE EXCEPTION 'Published or revoked revision cannot be deleted'; END IF;
    RETURN OLD;
  END IF;
  IF NEW.revision<>OLD.revision OR
     (OLD.status<>'draft' AND NEW.manifest IS DISTINCT FROM OLD.manifest) OR
     (OLD.status='published' AND NEW.status='draft') OR
     (OLD.status='revoked' AND NEW.status<>'revoked') THEN
    RAISE EXCEPTION 'Published creation revision is immutable and can only be revoked';
  END IF;
  IF NEW.status='published' AND OLD.status='draft' THEN
    PERFORM story_private.validate_creation_manifest(NEW.revision, NEW.manifest);
  END IF;
  RETURN NEW;
END $$;

CREATE FUNCTION story_private.validate_creation_manifest(p_revision integer,p_manifest text)
RETURNS void LANGUAGE plpgsql SET search_path='' AS $$
DECLARE m jsonb; item jsonb; marker jsonb; point jsonb; pos integer;
BEGIN
  IF p_manifest IS NULL OR octet_length(p_manifest)>65536 THEN
    RAISE EXCEPTION 'Incomplete creation manifest';
  END IF;
  m:=p_manifest::jsonb;
  IF jsonb_typeof(m) IS DISTINCT FROM 'object'
     OR jsonb_typeof(m->'revision') IS DISTINCT FROM 'number'
     OR (m->>'revision')::numeric<>trunc((m->>'revision')::numeric)
     OR (m->>'revision')::integer<>p_revision
     OR jsonb_typeof(m->'days') IS DISTINCT FROM 'array' OR jsonb_array_length(m->'days')<>7
     OR jsonb_typeof(m->'harmony') IS DISTINCT FROM 'array' OR jsonb_array_length(m->'harmony')<>7
     OR jsonb_typeof(m->'quiz') IS DISTINCT FROM 'array' OR jsonb_array_length(m->'quiz')<>5 THEN
    RAISE EXCEPTION 'Incomplete creation manifest';
  END IF;
  IF (SELECT count(DISTINCT value->>'id') FROM jsonb_array_elements(m->'days'))<>7
     OR (SELECT count(DISTINCT value->>'id') FROM jsonb_array_elements(m->'quiz'))<>5 THEN
    RAISE EXCEPTION 'Creation content identifiers must be unique';
  END IF;
  FOR pos IN 1..7 LOOP
    item:=m->'days'->(pos-1);
    IF jsonb_typeof(item) IS DISTINCT FROM 'object'
       OR jsonb_typeof(item->'id') IS DISTINCT FROM 'string'
       OR item->>'id' IS DISTINCT FROM 'creation-day-'||pos::text
       OR (m->'harmony'->(pos-1)) IS DISTINCT FROM item->'id'
       OR EXISTS(
         SELECT 1 FROM unnest(ARRAY['title','harmonyLabel','reference','passage','motifs','objective','question','explanation']) AS f(key)
         WHERE jsonb_typeof(item->f.key) IS DISTINCT FROM 'string' OR coalesce(btrim(item->>f.key),'')=''
       )
       OR jsonb_typeof(item->'options') IS DISTINCT FROM 'array'
       OR jsonb_array_length(item->'options')<>2
       OR EXISTS(SELECT 1 FROM jsonb_array_elements(item->'options') x
                 WHERE jsonb_typeof(x) IS DISTINCT FROM 'string' OR coalesce(btrim(x#>>'{}'),'')='')
       OR (SELECT count(DISTINCT x) FROM jsonb_array_elements(item->'options') x)<>2
       OR jsonb_typeof(item->'answer') IS DISTINCT FROM 'number'
       OR (item->>'answer')::numeric<>trunc((item->>'answer')::numeric)
       OR (item->>'answer')::integer NOT BETWEEN 1 AND jsonb_array_length(item->'options')
       OR jsonb_typeof(item->'markers') IS DISTINCT FROM 'array'
       OR jsonb_array_length(item->'markers')<1 THEN
      RAISE EXCEPTION 'Invalid creation day content';
    END IF;
    FOR marker IN SELECT value FROM jsonb_array_elements(item->'markers') LOOP
      point:=marker->'point';
      IF jsonb_typeof(marker) IS DISTINCT FROM 'object'
         OR jsonb_typeof(marker->'label') IS DISTINCT FROM 'string' OR coalesce(btrim(marker->>'label'),'')=''
         OR jsonb_typeof(marker->'symbol') IS DISTINCT FROM 'string' OR coalesce(btrim(marker->>'symbol'),'')=''
         OR jsonb_typeof(point) IS DISTINCT FROM 'object'
         OR jsonb_typeof(point->'x') IS DISTINCT FROM 'number' OR jsonb_typeof(point->'y') IS DISTINCT FROM 'number'
         OR (point->>'x')::numeric NOT BETWEEN 0 AND 100
         OR (point->>'y')::numeric NOT BETWEEN 0 AND 100
         OR (marker ? 'note' AND (jsonb_typeof(marker->'note') IS DISTINCT FROM 'string' OR coalesce(btrim(marker->>'note'),'')='')) THEN
        RAISE EXCEPTION 'Invalid creation marker';
      END IF;
    END LOOP;
  END LOOP;
  FOR pos IN 1..5 LOOP
    item:=m->'quiz'->(pos-1);
    IF jsonb_typeof(item) IS DISTINCT FROM 'object'
       OR jsonb_typeof(item->'id') IS DISTINCT FROM 'string'
       OR coalesce(btrim(item->>'id'),'')=''
       OR (item->>'id') !~ '^[a-z][a-z0-9-]{0,31}$'
       OR EXISTS(
         SELECT 1 FROM unnest(ARRAY['question','reference','passage','explanation']) AS f(key)
         WHERE jsonb_typeof(item->f.key) IS DISTINCT FROM 'string' OR coalesce(btrim(item->>f.key),'')=''
       )
       OR jsonb_typeof(item->'options') IS DISTINCT FROM 'array' OR jsonb_array_length(item->'options')<>3
       OR jsonb_typeof(item->'optionIds') IS DISTINCT FROM 'array' OR jsonb_array_length(item->'optionIds')<>3
       OR EXISTS(SELECT 1 FROM jsonb_array_elements(item->'options') x
                 WHERE jsonb_typeof(x) IS DISTINCT FROM 'string' OR coalesce(btrim(x#>>'{}'),'')='')
       OR (SELECT count(DISTINCT x) FROM jsonb_array_elements(item->'options') x)<>3
       OR EXISTS(SELECT 1 FROM jsonb_array_elements(item->'optionIds') x
                 WHERE jsonb_typeof(x) IS DISTINCT FROM 'string' OR (x#>>'{}') !~ '^[a-z][a-z0-9_-]{0,15}$')
       OR (SELECT count(DISTINCT x) FROM jsonb_array_elements(item->'optionIds') x)<>3
       OR jsonb_typeof(item->'answer') IS DISTINCT FROM 'number'
       OR (item->>'answer')::numeric<>trunc((item->>'answer')::numeric)
       OR (item->>'answer')::integer NOT BETWEEN 1 AND jsonb_array_length(item->'options') THEN
      RAISE EXCEPTION 'Invalid creation quiz content';
    END IF;
  END LOOP;
END $$;
CREATE TRIGGER creation_revision_state_guard BEFORE INSERT OR UPDATE OR DELETE ON story_private.creation_checkpoint_revisions
  FOR EACH ROW EXECUTE FUNCTION story_private.guard_creation_revision();

CREATE TABLE story_private.creation_video_publications (
  revision integer PRIMARY KEY REFERENCES story_private.creation_checkpoint_revisions(revision),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','revoked')),
  provider text,
  immutable_video_id text,
  media_sha256 text,
  duration_seconds integer CHECK (duration_seconds>0),
  language text,
  captions_sha256 text,
  accessible_alternative text,
  editorial_reference text,
  license_reference text,
  verification_policy_version text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status<>'published' OR
    (provider IS NOT NULL AND immutable_video_id IS NOT NULL AND media_sha256 IS NOT NULL AND media_sha256 ~ '^[0-9a-f]{64}$'
      AND duration_seconds IS NOT NULL AND language IS NOT NULL AND captions_sha256 IS NOT NULL AND captions_sha256 ~ '^[0-9a-f]{64}$'
      AND accessible_alternative IS NOT NULL AND editorial_reference IS NOT NULL
      AND license_reference IS NOT NULL AND verification_policy_version IS NOT NULL))
);
INSERT INTO story_private.creation_video_publications(revision,status) VALUES (1,'draft');
CREATE FUNCTION story_private.guard_creation_video_publication() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  IF OLD.status='revoked' AND NEW.status<>'revoked' THEN
    RAISE EXCEPTION 'Revoked creation video publication cannot be reactivated';
  END IF;
  IF OLD.status='published' AND (NEW.status NOT IN ('published','revoked') OR
    ROW(NEW.revision,NEW.provider,NEW.immutable_video_id,NEW.media_sha256,NEW.duration_seconds,
      NEW.language,NEW.captions_sha256,NEW.accessible_alternative,NEW.editorial_reference,
      NEW.license_reference,NEW.verification_policy_version) IS DISTINCT FROM
    ROW(OLD.revision,OLD.provider,OLD.immutable_video_id,OLD.media_sha256,OLD.duration_seconds,
      OLD.language,OLD.captions_sha256,OLD.accessible_alternative,OLD.editorial_reference,
      OLD.license_reference,OLD.verification_policy_version)) THEN
    RAISE EXCEPTION 'Published video manifest is immutable; create a new revision';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER creation_video_publication_guard BEFORE UPDATE ON story_private.creation_video_publications
  FOR EACH ROW EXECUTE FUNCTION story_private.guard_creation_video_publication();

CREATE TABLE story_private.creation_activity_receipts (
  traveler_id uuid NOT NULL REFERENCES public.travelers(id) ON DELETE CASCADE,
  story_id text NOT NULL DEFAULT 'creation' CHECK (story_id='creation'),
  revision integer NOT NULL REFERENCES story_private.creation_checkpoint_revisions(revision),
  activity text NOT NULL CHECK (activity IN ('day','harmony')),
  activity_key text NOT NULL,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (traveler_id,story_id,revision,activity,activity_key),
  CHECK ((activity='day' AND activity_key ~ '^day:[1-7]$') OR
         (activity='harmony' AND activity_key='seven-symbols:v1'))
);
CREATE TABLE story_private.creation_quiz_attempts (
  traveler_id uuid NOT NULL REFERENCES public.travelers(id) ON DELETE CASCADE,
  story_id text NOT NULL DEFAULT 'creation' CHECK (story_id='creation'),
  revision integer NOT NULL REFERENCES story_private.creation_checkpoint_revisions(revision),
  operation_id uuid NOT NULL,
  answers smallint[] NOT NULL CHECK (cardinality(answers)=5),
  score smallint NOT NULL CHECK (score BETWEEN 0 AND 5),
  perfect boolean GENERATED ALWAYS AS (score=5) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (traveler_id,story_id,revision,operation_id),
  CHECK (array_position(answers,NULL) IS NULL AND answers <@ ARRAY[1,2,3]::smallint[])
);

ALTER TABLE story_private.creation_checkpoint_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_private.creation_video_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_private.creation_activity_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_private.creation_quiz_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON story_private.creation_checkpoint_revisions,story_private.creation_activity_receipts,
  story_private.creation_quiz_attempts,story_private.creation_video_publications FROM PUBLIC,anon,authenticated,service_role;
-- Neither browser nor service_role writes evidence/config. Owner-run, reviewed publication
-- updates config; SECURITY DEFINER RPCs alone write validated activity and quiz receipts.

CREATE FUNCTION story_private.require_creation_actor(p_traveler_id uuid)
RETURNS void LANGUAGE plpgsql STABLE SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid(); v_session text:=auth.jwt()->>'session_id';
BEGIN
  IF v_uid IS NULL OR NOT coalesce(v_session ~* '^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$',false) THEN
    RAISE EXCEPTION 'Creation session unavailable' USING ERRCODE='42501';
  END IF;
  IF NOT EXISTS(
    SELECT 1 FROM auth.users u JOIN auth.sessions s ON s.user_id=u.id
    JOIN public.travelers t ON t.user_id=u.id
    WHERE u.id=v_uid AND u.is_anonymous IS FALSE AND u.deleted_at IS NULL
      AND (u.banned_until IS NULL OR u.banned_until<=clock_timestamp())
      AND s.id=v_session::uuid AND (s.not_after IS NULL OR s.not_after>clock_timestamp())
      AND t.id=p_traveler_id AND t.is_active
  ) THEN
    RAISE EXCEPTION 'Creation account or active traveler unavailable' USING ERRCODE='42501';
  END IF;
END $$;

CREATE FUNCTION story_private.require_creation_revision(p_revision integer)
RETURNS text LANGUAGE plpgsql SET search_path='' AS $$
DECLARE v_manifest text;
BEGIN
  SELECT r.manifest INTO v_manifest FROM public.story_definitions d
    JOIN story_private.creation_checkpoint_revisions r ON r.revision=d.revision
    WHERE d.id='creation' AND d.revision=p_revision AND d.content_ready AND r.status='published'
    FOR SHARE OF d,r;
  IF NOT FOUND OR v_manifest IS NULL THEN
    RAISE EXCEPTION 'Creation revision unavailable' USING ERRCODE='55000';
  END IF;
  RETURN v_manifest;
END $$;
REVOKE ALL ON FUNCTION story_private.require_creation_revision(integer),
  story_private.require_creation_actor(uuid),story_private.validate_creation_manifest(integer,text),
  story_private.guard_creation_revision(),
  story_private.guard_creation_video_publication() FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.submit_creation_day(p_traveler_id uuid,p_revision integer,p_day smallint,p_answer_index smallint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_revision integer; v_manifest text; v_content jsonb; v_day jsonb;
  v_answer smallint; v_options smallint; v_reference text; v_result jsonb; v_key text;
BEGIN
  PERFORM 1 FROM public.travelers t WHERE t.id=p_traveler_id AND t.user_id=auth.uid() FOR UPDATE;
  PERFORM story_private.require_creation_actor(p_traveler_id);
  SELECT revision INTO STRICT v_revision FROM public.story_definitions WHERE id='creation';
  IF p_revision IS DISTINCT FROM v_revision THEN RAISE EXCEPTION 'Stale creation revision' USING ERRCODE='55000'; END IF;
  v_manifest:=story_private.require_creation_revision(v_revision);
  v_content:=v_manifest::jsonb;
  IF p_day IS NULL OR p_day NOT BETWEEN 1 AND 7 THEN RAISE EXCEPTION 'Invalid day' USING ERRCODE='22023'; END IF;
  v_day:=v_content->'days'->(p_day-1);
  v_answer:=(v_day->>'answer')::smallint;
  v_options:=jsonb_array_length(v_day->'options');
  v_reference:=v_day->>'reference';
  v_key:='day:'||p_day::text;
  SELECT result INTO v_result FROM story_private.creation_activity_receipts
    WHERE traveler_id=p_traveler_id AND story_id='creation' AND revision=v_revision AND activity='day' AND activity_key=v_key;
  IF FOUND THEN RETURN v_result; END IF;
  IF p_answer_index IS NULL OR p_answer_index NOT BETWEEN 1 AND v_options THEN RAISE EXCEPTION 'Invalid answer' USING ERRCODE='22023'; END IF;
  IF p_day>1 AND (SELECT count(*) FROM story_private.creation_activity_receipts r
    WHERE r.traveler_id=p_traveler_id AND r.story_id='creation' AND r.revision=v_revision
      AND r.activity='day' AND r.activity_key=ANY(ARRAY(
        SELECT 'day:'||prior.day_no::text FROM generate_series(1,p_day-1) AS prior(day_no))))<>p_day-1 THEN
    RAISE EXCEPTION 'Previous creation day incomplete' USING ERRCODE='55000';
  END IF;
  IF p_answer_index<>v_answer THEN RETURN jsonb_build_object('version',1,'completed',false,'correct',false,'reference',v_reference); END IF;
  v_result:=jsonb_build_object('version',1,'completed',true,'correct',true,'day',p_day,
    'revision',v_revision,'reference',v_reference);
  INSERT INTO story_private.creation_activity_receipts(traveler_id,revision,activity,activity_key,result)
    VALUES(p_traveler_id,v_revision,'day',v_key,v_result) ON CONFLICT DO NOTHING;
  SELECT result INTO v_result FROM story_private.creation_activity_receipts
    WHERE traveler_id=p_traveler_id AND story_id='creation' AND revision=v_revision AND activity='day' AND activity_key=v_key;
  RETURN v_result;
END $$;

CREATE FUNCTION public.submit_creation_harmony(p_traveler_id uuid,p_revision integer,p_order smallint[])
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_revision integer; v_result jsonb;
BEGIN
  PERFORM 1 FROM public.travelers t WHERE t.id=p_traveler_id AND t.user_id=auth.uid() FOR UPDATE;
  PERFORM story_private.require_creation_actor(p_traveler_id);
  SELECT revision INTO STRICT v_revision FROM public.story_definitions WHERE id='creation';
  IF p_revision IS DISTINCT FROM v_revision THEN RAISE EXCEPTION 'Stale creation revision' USING ERRCODE='55000'; END IF;
  PERFORM story_private.require_creation_revision(v_revision);
  IF (SELECT count(*) FROM story_private.creation_activity_receipts r WHERE r.traveler_id=p_traveler_id
    AND r.story_id='creation' AND r.revision=v_revision AND r.activity='day')<>7 THEN
    RAISE EXCEPTION 'Seven creation days incomplete' USING ERRCODE='55000';
  END IF;
  SELECT result INTO v_result FROM story_private.creation_activity_receipts WHERE traveler_id=p_traveler_id
    AND story_id='creation' AND revision=v_revision AND activity='harmony' AND activity_key='seven-symbols:v1';
  IF FOUND THEN RETURN v_result; END IF;
  IF p_order IS NULL OR cardinality(p_order)<>7 OR p_order<>ARRAY[1,2,3,4,5,6,7]::smallint[] THEN
    RETURN jsonb_build_object('version',1,'completed',false,'correct',false,'reference','Gênesis 1:1–2:3');
  END IF;
  v_result:=jsonb_build_object('version',1,'completed',true,'correct',true,'revision',v_revision,
    'reference','Gênesis 1:1–2:3');
  INSERT INTO story_private.creation_activity_receipts(traveler_id,revision,activity,activity_key,result)
    VALUES(p_traveler_id,v_revision,'harmony','seven-symbols:v1',v_result) ON CONFLICT DO NOTHING;
  SELECT result INTO v_result FROM story_private.creation_activity_receipts WHERE traveler_id=p_traveler_id
    AND story_id='creation' AND revision=v_revision AND activity='harmony' AND activity_key='seven-symbols:v1';
  RETURN v_result;
END $$;

CREATE FUNCTION public.submit_creation_quiz(p_traveler_id uuid,p_revision integer,p_operation_id uuid,p_answers smallint[])
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_revision integer; v_manifest text; v_content jsonb; v_score smallint;
  v_result jsonb; v_saved story_private.creation_quiz_attempts;
BEGIN
  PERFORM 1 FROM public.travelers t WHERE t.id=p_traveler_id AND t.user_id=auth.uid() FOR UPDATE;
  PERFORM story_private.require_creation_actor(p_traveler_id);
  SELECT revision INTO STRICT v_revision FROM public.story_definitions WHERE id='creation';
  IF p_revision IS DISTINCT FROM v_revision THEN RAISE EXCEPTION 'Stale creation revision' USING ERRCODE='55000'; END IF;
  v_manifest:=story_private.require_creation_revision(v_revision);
  v_content:=v_manifest::jsonb;
  IF p_operation_id IS NULL THEN RAISE EXCEPTION 'Invalid quiz attempt' USING ERRCODE='22023'; END IF;
  IF EXISTS(SELECT 1 FROM story_private.creation_quiz_attempts WHERE traveler_id=p_traveler_id
    AND story_id='creation' AND revision=v_revision AND operation_id=p_operation_id) THEN
    SELECT * INTO STRICT v_saved FROM story_private.creation_quiz_attempts WHERE traveler_id=p_traveler_id
      AND story_id='creation' AND revision=v_revision AND operation_id=p_operation_id;
    IF v_saved.answers IS DISTINCT FROM p_answers THEN
      RAISE EXCEPTION 'Quiz operation payload mismatch' USING ERRCODE='22023';
    END IF;
    RETURN jsonb_build_object('version',1,'attemptId',v_saved.operation_id,'score',v_saved.score,
      'total',5,'perfect',v_saved.perfect,'revision',v_revision,'replayed',true);
  END IF;
  IF p_answers IS NULL OR cardinality(p_answers)<>5
    OR array_lower(p_answers,1)<>1 OR array_upper(p_answers,1)<>5
    OR array_position(p_answers,NULL) IS NOT NULL OR NOT (p_answers <@ ARRAY[1,2,3]::smallint[]) THEN
    RAISE EXCEPTION 'Invalid quiz attempt' USING ERRCODE='22023';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM story_private.creation_activity_receipts r WHERE r.traveler_id=p_traveler_id
    AND r.story_id='creation' AND r.revision=v_revision AND r.activity='harmony' AND r.activity_key='seven-symbols:v1') THEN
    RAISE EXCEPTION 'Harmony incomplete' USING ERRCODE='55000';
  END IF;
  SELECT count(*)::smallint INTO v_score
    FROM generate_series(0,4) AS question(position)
    WHERE p_answers[question.position+1]=((v_content->'quiz'->question.position->>'answer')::smallint);
  INSERT INTO story_private.creation_quiz_attempts(traveler_id,revision,operation_id,answers,score)
    VALUES(p_traveler_id,v_revision,p_operation_id,p_answers,v_score);
  RETURN jsonb_build_object('version',1,'attemptId',p_operation_id,'score',v_score,'total',5,
    'perfect',v_score=5,'revision',v_revision,'replayed',false);
END $$;

CREATE FUNCTION public.read_creation_checkpoints(p_traveler_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_revision integer; v_result jsonb;
BEGIN
  PERFORM story_private.require_creation_actor(p_traveler_id);
  SELECT revision INTO STRICT v_revision FROM public.story_definitions WHERE id='creation';
  SELECT jsonb_build_object('version',1,'storyId','creation','revision',v_revision,
    'completedDays',coalesce((SELECT jsonb_agg(split_part(activity_key,':',2)::int ORDER BY split_part(activity_key,':',2)::int)
      FROM story_private.creation_activity_receipts WHERE traveler_id=p_traveler_id AND story_id='creation'
        AND revision=v_revision AND activity='day'),'[]'::jsonb),
    'harmonyCompleted',EXISTS(SELECT 1 FROM story_private.creation_activity_receipts WHERE traveler_id=p_traveler_id
      AND story_id='creation' AND revision=v_revision AND activity='harmony'),
    'quizAttempts',coalesce((SELECT count(*) FROM story_private.creation_quiz_attempts WHERE traveler_id=p_traveler_id
      AND story_id='creation' AND revision=v_revision),0),
    'bestQuizScore',(SELECT max(score) FROM story_private.creation_quiz_attempts WHERE traveler_id=p_traveler_id
      AND story_id='creation' AND revision=v_revision),
    'available',EXISTS(SELECT 1 FROM public.story_definitions d JOIN story_private.creation_checkpoint_revisions r
      ON r.revision=d.revision WHERE d.id='creation' AND d.revision=v_revision AND d.content_ready AND r.status='published'),
    'manifestText',(SELECT r.manifest FROM story_private.creation_checkpoint_revisions r WHERE revision=v_revision),
    'manifestHash',(SELECT encode(sha256(convert_to(r.manifest,'UTF8')),'hex') FROM story_private.creation_checkpoint_revisions r WHERE revision=v_revision),
    'videoCompleted',false) INTO v_result;
  RETURN v_result;
END $$;

REVOKE ALL ON FUNCTION public.submit_creation_day(uuid,integer,smallint,smallint),
  public.submit_creation_harmony(uuid,integer,smallint[]),public.submit_creation_quiz(uuid,integer,uuid,smallint[]),
  public.read_creation_checkpoints(uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.submit_creation_day(uuid,integer,smallint,smallint),
  public.submit_creation_harmony(uuid,integer,smallint[]),public.submit_creation_quiz(uuid,integer,uuid,smallint[]),
  public.read_creation_checkpoints(uuid) TO authenticated;
COMMENT ON FUNCTION public.submit_creation_day(uuid,integer,smallint,smallint) IS 'STORY-007 local proposal. Auth owner + active traveler; checks published server key and contiguous days; no economy write.';
COMMENT ON FUNCTION public.submit_creation_harmony(uuid,integer,smallint[]) IS 'STORY-007 local proposal. Requires seven current-revision day receipts; no economy write.';
COMMENT ON FUNCTION public.submit_creation_quiz(uuid,integer,uuid,smallint[]) IS 'STORY-007 local proposal. Idempotent by account/traveler/revision/operation; server scores attempts; no economy write.';
COMMENT ON FUNCTION public.read_creation_checkpoints(uuid) IS 'STORY-007 local proposal. Read-only resume snapshot; does not mark video or phase complete.';
COMMIT;
