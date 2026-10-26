-- BACKEND-006: isolated, RLS-closed, durable synthetic task belt.
-- No real-world action, mail, compute, or participant data is authorized here.
CREATE TABLE IF NOT EXISTS public.jarvis_backend_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL UNIQUE CHECK (length(idempotency_key) BETWEEN 8 AND 120),
  lane text NOT NULL DEFAULT 'compute' CHECK (lane = 'compute'),
  kind text NOT NULL DEFAULT 'SYNTHETIC_MEASURE' CHECK (kind = 'SYNTHETIC_MEASURE'),
  label text NOT NULL CHECK (length(label) BETWEEN 1 AND 160),
  status text NOT NULL DEFAULT 'HELD' CHECK (status IN ('HELD','READY','LEASED','RETURNED','CANCELLED')),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  lease_owner text,
  lease_until timestamptz,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0 AND attempts <= 3),
  result jsonb,
  CONSTRAINT jarvis_backend_no_unverified_promotion CHECK (
    status <> 'RETURNED' OR (result IS NOT NULL AND jsonb_typeof(result) = 'object')
  )
);
COMMENT ON TABLE public.jarvis_backend_jobs IS
  'JAR;VIS 006 synthetic-only persistent task queue. HELD does not confer consent or execution authority.';
ALTER TABLE public.jarvis_backend_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.jarvis_backend_jobs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.jarvis_backend_jobs TO service_role;

CREATE TABLE IF NOT EXISTS public.jarvis_backend_receipts (
  seq bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES public.jarvis_backend_jobs(id) ON DELETE RESTRICT,
  kind text NOT NULL CHECK (kind IN ('QUEUED','OPERATOR_ADMITTED','LEASE_CLAIMED','LEASE_RECLAIMED','COMPUTE_RETURNED')),
  observation jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (octet_length(observation::text) <= 2048),
  recorded_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.jarvis_backend_receipts IS
  'Append-only metadata receipts; COMPUTE_RETURNED is not admission or external delivery.';
ALTER TABLE public.jarvis_backend_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.jarvis_backend_receipts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.jarvis_backend_receipts TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.jarvis_backend_receipts_seq_seq TO service_role;

-- Even the backend role may not silently edit or delete a historical receipt.
CREATE OR REPLACE FUNCTION public.jarvis_backend_receipt_immutable()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER
SET search_path = '' AS $$
BEGIN
  RAISE EXCEPTION 'RECEIPTS_APPEND_ONLY';
END; $$;
REVOKE ALL ON FUNCTION public.jarvis_backend_receipt_immutable() FROM PUBLIC;
DROP TRIGGER IF EXISTS jarvis_receipts_immutable ON public.jarvis_backend_receipts;
CREATE TRIGGER jarvis_receipts_immutable
  BEFORE UPDATE OR DELETE ON public.jarvis_backend_receipts
  FOR EACH ROW EXECUTE FUNCTION public.jarvis_backend_receipt_immutable();

CREATE OR REPLACE FUNCTION public.jarvis_backend_enqueue_fixture(p_key text, p_label text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET search_path = '' AS $$
DECLARE j public.jarvis_backend_jobs%ROWTYPE; was_new boolean := false;
BEGIN
  IF p_key IS NULL OR length(p_key) NOT BETWEEN 8 AND 120 OR
     p_label IS NULL OR length(p_label) NOT BETWEEN 1 AND 160
  THEN RAISE EXCEPTION 'INVALID_FIXTURE'; END IF;
  INSERT INTO public.jarvis_backend_jobs(idempotency_key,label)
    VALUES (p_key,p_label) ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING * INTO j;
  IF FOUND THEN
    was_new:=true;
    INSERT INTO public.jarvis_backend_receipts(job_id,kind,observation)
      VALUES(j.id,'QUEUED',jsonb_build_object('lane','compute','synthetic',true));
  ELSE
    SELECT * INTO j FROM public.jarvis_backend_jobs WHERE idempotency_key=p_key;
  END IF;
  RETURN jsonb_build_object('id',j.id,'status',j.status,'created',was_new,
                           'disposition','HOLD_FOR_OPERATOR');
END; $$;

CREATE OR REPLACE FUNCTION public.jarvis_backend_admit_fixture(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET search_path = '' AS $$
DECLARE j public.jarvis_backend_jobs%ROWTYPE;
BEGIN
  UPDATE public.jarvis_backend_jobs SET status='READY',approved_at=now(),updated_at=now()
    WHERE id=p_id AND status='HELD' AND kind='SYNTHETIC_MEASURE'
    RETURNING * INTO j;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'reason','NOT_HELD'); END IF;
  INSERT INTO public.jarvis_backend_receipts(job_id,kind,observation)
    VALUES (j.id,'OPERATOR_ADMITTED',jsonb_build_object('effect','synthetic_only'));
  RETURN jsonb_build_object('ok',true,'id',j.id,'status',j.status);
END; $$;

CREATE OR REPLACE FUNCTION public.jarvis_backend_claim_fixture(p_worker text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET search_path = '' AS $$
DECLARE j public.jarvis_backend_jobs%ROWTYPE; reclaimed boolean;
BEGIN
  IF p_worker IS NULL OR p_worker !~ '^[A-Za-z0-9_-]{4,64}$'
    THEN RAISE EXCEPTION 'INVALID_WORKER'; END IF;
  SELECT * INTO j FROM public.jarvis_backend_jobs
    WHERE kind='SYNTHETIC_MEASURE' AND approved_at IS NOT NULL AND
      attempts<3 AND (status='READY' OR (status='LEASED' AND lease_until<now()))
    ORDER BY created_at,id
    FOR UPDATE SKIP LOCKED LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('claimed',false); END IF;
  reclaimed := (j.status='LEASED');
  UPDATE public.jarvis_backend_jobs SET status='LEASED',lease_owner=p_worker,
    lease_until=now()+interval '90 seconds',attempts=attempts+1,updated_at=now()
    WHERE id=j.id RETURNING * INTO j;
  INSERT INTO public.jarvis_backend_receipts(job_id,kind,observation)
    VALUES(j.id,CASE WHEN reclaimed THEN 'LEASE_RECLAIMED' ELSE 'LEASE_CLAIMED' END,
      jsonb_build_object('attempt',j.attempts,'worker',p_worker));
  RETURN jsonb_build_object('claimed',true,'id',j.id,'label',j.label,
    'leaseUntil',j.lease_until,'attempt',j.attempts,'workKind',j.kind,'synthetic',true);
END; $$;

CREATE OR REPLACE FUNCTION public.jarvis_backend_return_fixture(
  p_id uuid, p_worker text, p_result jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET search_path = '' AS $$
DECLARE j public.jarvis_backend_jobs%ROWTYPE;
BEGIN
  IF p_result IS NULL OR jsonb_typeof(p_result)<>'object' OR
     octet_length(p_result::text)>2048
    THEN RAISE EXCEPTION 'INVALID_RESULT'; END IF;
  UPDATE public.jarvis_backend_jobs
    SET status='RETURNED',result=p_result,updated_at=now(),lease_until=NULL,lease_owner=NULL
    WHERE id=p_id AND status='LEASED' AND lease_owner=p_worker AND lease_until>now()
      AND kind='SYNTHETIC_MEASURE' RETURNING * INTO j;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'reason','LEASE_NOT_OWNED_OR_EXPIRED'); END IF;
  INSERT INTO public.jarvis_backend_receipts(job_id,kind,observation)
    VALUES(j.id,'COMPUTE_RETURNED',jsonb_build_object('attempt',j.attempts,
      'verifiedRealWorldClaims',false,'externalEffects',0));
  RETURN jsonb_build_object('ok',true,'id',j.id,'state','RETURNED',
    'admitted',false,'verifiedRealWorldClaims',false);
END; $$;

CREATE OR REPLACE FUNCTION public.jarvis_backend_snapshot()
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = '' AS $$
  SELECT jsonb_build_object(
    'schema','jarvis.backend-snapshot/v1',
    'mode','SYNTHETIC / EFFECTS_HOLD',
    'jobs',(SELECT count(*) FROM public.jarvis_backend_jobs),
    'held',(SELECT count(*) FROM public.jarvis_backend_jobs WHERE status='HELD'),
    'ready',(SELECT count(*) FROM public.jarvis_backend_jobs WHERE status='READY'),
    'leased',(SELECT count(*) FROM public.jarvis_backend_jobs WHERE status='LEASED'),
    'returned',(SELECT count(*) FROM public.jarvis_backend_jobs WHERE status='RETURNED'),
    'receiptCount',(SELECT count(*) FROM public.jarvis_backend_receipts),
    'externalEffects',0
  );
$$;

REVOKE ALL ON FUNCTION public.jarvis_backend_enqueue_fixture(text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.jarvis_backend_admit_fixture(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.jarvis_backend_claim_fixture(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.jarvis_backend_return_fixture(uuid,text,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.jarvis_backend_snapshot() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.jarvis_backend_enqueue_fixture(text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.jarvis_backend_admit_fixture(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.jarvis_backend_claim_fixture(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.jarvis_backend_return_fixture(uuid,text,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.jarvis_backend_snapshot() TO service_role;
