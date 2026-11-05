-- NOW-ROUTE 003: invitation-gated, account-free physical exchange pilot.
-- Same Supabase pantry-gate project. Does NOT alter existing Garden or IC02 tables.
-- All tables have RLS with NO client policies or grants. Only Edge server role acts.
CREATE TABLE public.nr03_invites(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 role text NOT NULL CHECK(role IN ('OFFER','NEED')),
 token_hash text NOT NULL UNIQUE CHECK(token_hash ~ '^[0-9a-f]{64}$'),
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL,
 used_at timestamptz
);
CREATE TABLE public.nr03_posts(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 invite_id uuid UNIQUE REFERENCES public.nr03_invites(id) ON DELETE SET NULL,
 role text NOT NULL CHECK(role IN ('OFFER','NEED')),
 category text NOT NULL CHECK(category IN ('food','tools','other')),
 summary text NOT NULL CHECK(summary = btrim(summary) AND char_length(summary) BETWEEN 8 AND 180),
 zone text NOT NULL CHECK(zone IN ('center','north','south','east','west')),
 radius_miles smallint NOT NULL DEFAULT 5 CHECK(radius_miles BETWEEN 1 AND 5),
 pickup_minutes smallint CHECK(pickup_minutes BETWEEN 0 AND 120),
 perishable boolean NOT NULL DEFAULT false,
 explicit_opt_in boolean NOT NULL CHECK(explicit_opt_in),
 owner_hash text NOT NULL UNIQUE CHECK(owner_hash ~ '^[0-9a-f]{64}$'),
 state text NOT NULL DEFAULT 'OPEN' CHECK(state IN ('OPEN','HELD','WITHDRAWN','CLOSED')),
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL,
 CHECK((role='OFFER' AND pickup_minutes IS NULL) OR (role='NEED' AND pickup_minutes IS NOT NULL)),
 CHECK(expires_at > created_at + interval '4 minutes' AND expires_at <= created_at + interval '4 hours'),
 CHECK(NOT perishable OR state IN ('HELD','WITHDRAWN','CLOSED'))
);
CREATE INDEX nr03_posts_avail ON public.nr03_posts(role,category,state,expires_at);
CREATE TABLE public.nr03_routes(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 offer_id uuid NOT NULL REFERENCES public.nr03_posts(id) ON DELETE CASCADE,
 need_id uuid NOT NULL REFERENCES public.nr03_posts(id) ON DELETE CASCADE,
 state text NOT NULL DEFAULT 'PROPOSED' CHECK(state IN
  ('PROPOSED','ACCEPTED','REPORTED','CONFIRMED','DECLINED','CANCELED','EXPIRED','DISPUTED')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(offer_id <> need_id)
);
CREATE UNIQUE INDEX nr03_one_route_offer ON public.nr03_routes(offer_id)
 WHERE state IN ('PROPOSED','ACCEPTED','REPORTED','CONFIRMED','DISPUTED');
CREATE UNIQUE INDEX nr03_one_route_need ON public.nr03_routes(need_id)
 WHERE state IN ('PROPOSED','ACCEPTED','REPORTED','CONFIRMED','DISPUTED');
CREATE TABLE public.nr03_messages(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 route_id uuid NOT NULL REFERENCES public.nr03_routes(id) ON DELETE CASCADE,
 sender_role text NOT NULL CHECK(sender_role IN ('DONOR','RECIPIENT')),
 body text NOT NULL CHECK(body=btrim(body) AND char_length(body) BETWEEN 2 AND 200),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX nr03_messages_route ON public.nr03_messages(route_id,created_at);
CREATE TABLE public.nr03_events(
 seq bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 route_id uuid NOT NULL REFERENCES public.nr03_routes(id) ON DELETE CASCADE,
 actor_role text NOT NULL CHECK(actor_role IN ('DONOR','RECIPIENT','SYSTEM')),
 action text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX nr03_events_route ON public.nr03_events(route_id,seq);

ALTER TABLE public.nr03_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nr03_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nr03_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nr03_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nr03_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.nr03_invites, public.nr03_posts, public.nr03_routes,
 public.nr03_messages, public.nr03_events FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.nr03_invites, public.nr03_posts, public.nr03_routes,
 public.nr03_messages, public.nr03_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.nr03_events_seq_seq TO service_role;

-- All action routines are SECURITY INVOKER, callable by service_role only.
CREATE FUNCTION public.nr03_zone_distance(a text,b text)
 RETURNS double precision LANGUAGE sql IMMUTABLE SET search_path=''
 AS $$
  WITH points AS (
   SELECT
    (CASE a WHEN 'center' THEN 44.08 WHEN 'north' THEN 44.11 WHEN 'south' THEN 44.05
      WHEN 'east' THEN 44.08 WHEN 'west' THEN 44.08 END)::double precision AS al,
    (CASE a WHEN 'center' THEN -93.51 WHEN 'north' THEN -93.50 WHEN 'south' THEN -93.51
      WHEN 'east' THEN -93.46 WHEN 'west' THEN -93.56 END)::double precision AS ao,
    (CASE b WHEN 'center' THEN 44.08 WHEN 'north' THEN 44.11 WHEN 'south' THEN 44.05
      WHEN 'east' THEN 44.08 WHEN 'west' THEN 44.08 END)::double precision AS bl,
    (CASE b WHEN 'center' THEN -93.51 WHEN 'north' THEN -93.50 WHEN 'south' THEN -93.51
      WHEN 'east' THEN -93.46 WHEN 'west' THEN -93.56 END)::double precision AS bo
  )
  SELECT (3958.76*2*asin(least(1.0,sqrt(
    power(sin(radians(al-bl)/2),2)+cos(radians(al))*cos(radians(bl))*
    power(sin(radians(ao-bo)/2),2)))))::double precision FROM points
 $$;
REVOKE ALL ON FUNCTION public.nr03_zone_distance(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nr03_zone_distance(text,text) TO service_role;

CREATE FUNCTION public.nr03_open(
 p_invite_hash text,p_owner_hash text,p_role text,p_category text,
 p_summary text,p_zone text,p_expire_minutes integer,p_pickup_minutes integer,
 p_perishable boolean)
 RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE v_inv uuid; v_post uuid;
BEGIN
 IF p_perishable IS NOT FALSE THEN
   RAISE EXCEPTION 'PERISHABLES_HELD_FOR_SAFETY_REVIEW';
 END IF;
 IF p_expire_minutes NOT IN (30,45,60,120,180) OR
    p_owner_hash !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'INVALID_OPEN'; END IF;
 UPDATE public.nr03_invites SET used_at=now()
  WHERE token_hash=p_invite_hash AND role=p_role AND used_at IS NULL AND expires_at>now()
  RETURNING id INTO v_inv;
 IF v_inv IS NULL THEN RAISE EXCEPTION 'INVITE_INVALID_OR_USED'; END IF;
 INSERT INTO public.nr03_posts
 (invite_id,role,category,summary,zone,owner_hash,expires_at,pickup_minutes,perishable,explicit_opt_in,state)
 VALUES (v_inv,p_role,p_category,p_summary,p_zone,p_owner_hash,
         now()+make_interval(mins=>p_expire_minutes),p_pickup_minutes,FALSE,TRUE,'OPEN')
 RETURNING id INTO v_post;
 RETURN v_post;
END $$;
REVOKE ALL ON FUNCTION public.nr03_open(text,text,text,text,text,text,integer,integer,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nr03_open(text,text,text,text,text,text,integer,integer,boolean) TO service_role;

CREATE FUNCTION public.nr03_propose(p_offer_id uuid,p_need_id uuid,p_owner_hash text)
 RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE o public.nr03_posts%ROWTYPE; n public.nr03_posts%ROWTYPE; v_id uuid;
BEGIN
 -- Lock in stable order; unique partial indexes enforce no double-reservation.
 PERFORM 1 FROM public.nr03_posts WHERE id IN(p_offer_id,p_need_id) ORDER BY id FOR UPDATE;
 SELECT * INTO o FROM public.nr03_posts WHERE id=p_offer_id;
 SELECT * INTO n FROM public.nr03_posts WHERE id=p_need_id;
 IF o.id IS NULL OR n.id IS NULL OR o.role <> 'OFFER' OR n.role <> 'NEED' OR
    o.owner_hash <> p_owner_hash OR o.category<>n.category OR o.state<>'OPEN' OR
    n.state<>'OPEN' OR o.expires_at<=now() OR n.expires_at<=now() OR
    o.invite_id=n.invite_id OR n.pickup_minutes IS NULL OR
    public.nr03_zone_distance(o.zone,n.zone)>least(o.radius_miles,n.radius_miles) OR
    now()+make_interval(mins=>n.pickup_minutes) >= least(o.expires_at,n.expires_at)
 THEN RAISE EXCEPTION 'NO_AUTHORIZED_CURRENT_MATCH'; END IF;
 INSERT INTO public.nr03_routes(offer_id,need_id,state)
 VALUES (o.id,n.id,'PROPOSED') RETURNING id INTO v_id;
 INSERT INTO public.nr03_events(route_id,actor_role,action)
 VALUES (v_id,'DONOR','PROPOSED');
 RETURN v_id;
EXCEPTION WHEN unique_violation THEN
 RAISE EXCEPTION 'ROUTE_ALREADY_RESERVED';
END $$;
REVOKE ALL ON FUNCTION public.nr03_propose(uuid,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nr03_propose(uuid,uuid,text) TO service_role;

CREATE FUNCTION public.nr03_advance(p_route_id uuid,p_owner_hash text,p_action text)
 RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE r public.nr03_routes%ROWTYPE; o public.nr03_posts%ROWTYPE; n public.nr03_posts%ROWTYPE;
 v_role text; v_state text;
BEGIN
 SELECT * INTO r FROM public.nr03_routes WHERE id=p_route_id FOR UPDATE;
 IF r.id IS NULL THEN RAISE EXCEPTION 'ROUTE_NOT_FOUND'; END IF;
 SELECT * INTO o FROM public.nr03_posts WHERE id=r.offer_id;
 SELECT * INTO n FROM public.nr03_posts WHERE id=r.need_id;
 IF o.owner_hash=p_owner_hash THEN v_role:='DONOR';
 ELSIF n.owner_hash=p_owner_hash THEN v_role:='RECIPIENT';
 ELSE RAISE EXCEPTION 'ROUTE_ACCESS_DENIED'; END IF;
 IF p_action='accept' AND v_role='RECIPIENT' AND r.state='PROPOSED'
   AND o.state='OPEN' AND n.state='OPEN'
   AND now()<least(o.expires_at,n.expires_at) THEN v_state:='ACCEPTED';
 ELSIF p_action='decline' AND v_role='RECIPIENT' AND r.state='PROPOSED' THEN v_state:='DECLINED';
 ELSIF p_action='cancel' AND r.state IN ('PROPOSED','ACCEPTED') THEN v_state:='CANCELED';
 ELSIF p_action='report' AND v_role='DONOR' AND r.state='ACCEPTED' THEN v_state:='REPORTED';
 ELSIF p_action='confirm' AND v_role='RECIPIENT' AND r.state='REPORTED' THEN v_state:='CONFIRMED';
 ELSIF p_action='dispute' AND v_role='RECIPIENT' AND r.state='REPORTED' THEN v_state:='DISPUTED';
 ELSE RAISE EXCEPTION 'TRANSITION_DENIED'; END IF;
 UPDATE public.nr03_routes SET state=v_state,updated_at=now() WHERE id=r.id;
 INSERT INTO public.nr03_events(route_id,actor_role,action) VALUES(r.id,v_role,upper(p_action));
 IF v_state='CONFIRMED' THEN
  UPDATE public.nr03_posts SET state='CLOSED' WHERE id IN(o.id,n.id);
 END IF;
 RETURN v_state;
END $$;
REVOKE ALL ON FUNCTION public.nr03_advance(uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nr03_advance(uuid,text,text) TO service_role;

CREATE FUNCTION public.nr03_withdraw(p_owner_hash text)
 RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE p public.nr03_posts%ROWTYPE;
BEGIN
 SELECT * INTO p FROM public.nr03_posts WHERE owner_hash=p_owner_hash FOR UPDATE;
 IF p.id IS NULL THEN RAISE EXCEPTION 'POST_NOT_FOUND'; END IF;
 IF p.state IN ('WITHDRAWN','CLOSED') THEN RETURN p.state; END IF;
 IF EXISTS(SELECT 1 FROM public.nr03_routes
   WHERE (offer_id=p.id OR need_id=p.id) AND state IN ('REPORTED','DISPUTED','CONFIRMED'))
 THEN RAISE EXCEPTION 'HANDOFF_REQUIRES_RESOLUTION'; END IF;
 UPDATE public.nr03_routes SET state='CANCELED',updated_at=now()
   WHERE (offer_id=p.id OR need_id=p.id) AND state IN ('PROPOSED','ACCEPTED');
 UPDATE public.nr03_posts SET state='WITHDRAWN' WHERE id=p.id;
 RETURN 'WITHDRAWN';
END $$;
REVOKE ALL ON FUNCTION public.nr03_withdraw(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nr03_withdraw(text) TO service_role;

CREATE FUNCTION public.nr03_send(p_route_id uuid,p_owner_hash text,p_body text)
 RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE r public.nr03_routes%ROWTYPE; v_role text; v_id uuid;
BEGIN
 SELECT * INTO r FROM public.nr03_routes WHERE id=p_route_id FOR UPDATE;
 IF r.id IS NULL OR r.state NOT IN ('ACCEPTED','REPORTED') THEN
   RAISE EXCEPTION 'CONVERSATION_NOT_OPEN'; END IF;
 IF EXISTS(SELECT 1 FROM public.nr03_posts WHERE id=r.offer_id AND owner_hash=p_owner_hash)
 THEN v_role:='DONOR';
 ELSIF EXISTS(SELECT 1 FROM public.nr03_posts WHERE id=r.need_id AND owner_hash=p_owner_hash)
 THEN v_role:='RECIPIENT';
 ELSE RAISE EXCEPTION 'CONVERSATION_ACCESS_DENIED'; END IF;
 IF (SELECT count(*) FROM public.nr03_messages WHERE route_id=r.id)>=24 THEN
   RAISE EXCEPTION 'CONVERSATION_LIMIT'; END IF;
 INSERT INTO public.nr03_messages(route_id,sender_role,body)
 VALUES(r.id,v_role,p_body) RETURNING id INTO v_id;
 RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.nr03_send(uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nr03_send(uuid,text,text) TO service_role;

CREATE FUNCTION public.nr03_housekeeping()
 RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 UPDATE public.nr03_routes r SET state='EXPIRED', updated_at=now()
  FROM public.nr03_posts o, public.nr03_posts n
  WHERE r.offer_id=o.id AND r.need_id=n.id AND r.state='PROPOSED'
   AND least(o.expires_at,n.expires_at)<=now();
 DELETE FROM public.nr03_posts WHERE expires_at < now() - interval '7 days';
 DELETE FROM public.nr03_invites WHERE expires_at < now() - interval '7 days';
END $$;
REVOKE ALL ON FUNCTION public.nr03_housekeeping() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nr03_housekeeping() TO service_role;

-- Prevent client roles from invoking ANY of these functions.
-- Retention job performs restricted server-side cleanup; avoid public function grants.
SELECT cron.schedule('nr03_retention_15m', '*/15 * * * *', 'SELECT public.nr03_housekeeping();');
