-- NOW-ROUTE PANTRY-GATE 001 -- DRAFT ONLY. DO NOT APPLY TO ACTIVE DATABASE
-- Owner: JAR;VIS local and Garden source boundary; new account-free physical-gift lane.
-- Reuse ACTIVE pantry-gate Supabase project without altering garden_entries,
-- workboard_entries, reality2_entries, quotas or BananaSpork/Jubilee tables.
-- All writes must arrive through a separately reviewed Edge Function using
-- server-held service credentials and authenticated per-record bearer capabilities.
-- No anon/authenticated direct table access is ever granted.

CREATE TABLE public.now_route_participations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('OFFER','NEED')),
  kind text NOT NULL CHECK (kind IN ('food','transport','tools','other')),
  description text NOT NULL CHECK (
    description = btrim(description) AND char_length(description) BETWEEN 12 AND 240
  ),
  -- Choose a *public area center*; never an actual residence or pickup location.
  approx_lat numeric(4,2) NOT NULL CHECK (approx_lat BETWEEN -90 AND 90),
  approx_lon numeric(5,2) NOT NULL CHECK (approx_lon BETWEEN -180 AND 180),
  radius_miles smallint NOT NULL DEFAULT 5 CHECK (radius_miles BETWEEN 1 AND 10),
  pickup_eta_minutes smallint CHECK (pickup_eta_minutes BETWEEN 0 AND 180),
  cold_chain_required boolean NOT NULL DEFAULT false,
  cold_chain_attested boolean NOT NULL DEFAULT false,
  explicit_matching_opt_in boolean NOT NULL CHECK (explicit_matching_opt_in = true),
  owner_token_hash text NOT NULL UNIQUE CHECK (owner_token_hash ~ '^[a-f0-9]{64}$'),
  state text NOT NULL DEFAULT 'OPEN' CHECK (state IN ('OPEN','WITHDRAWN','CLOSED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  CHECK (
    (role = 'OFFER' AND pickup_eta_minutes IS NULL) OR
    (role = 'NEED' AND pickup_eta_minutes IS NOT NULL)
  ),
  CHECK (NOT cold_chain_required OR kind = 'food'),
  CHECK (expires_at > created_at + interval '4 minutes'
    AND expires_at <= created_at + interval '4 hours')
);

-- Unique active reservations: no two accepted or proposed routes may
-- reserve the same physical item or the same need simultaneously.
CREATE TABLE public.now_route_crossings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.now_route_participations(id) ON DELETE RESTRICT,
  need_id uuid NOT NULL REFERENCES public.now_route_participations(id) ON DELETE RESTRICT,
  state text NOT NULL DEFAULT 'PROPOSED' CHECK (
    state IN ('PROPOSED','RECIPIENT_ACCEPTED','DONOR_ACCEPTED','REPORTED',
      'CONFIRMED','DECLINED','CANCELED','EXPIRED')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (offer_id <> need_id)
);
CREATE UNIQUE INDEX now_route_one_active_offer
  ON public.now_route_crossings(offer_id)
  WHERE state IN ('PROPOSED','RECIPIENT_ACCEPTED','DONOR_ACCEPTED','REPORTED','CONFIRMED');
CREATE UNIQUE INDEX now_route_one_active_need
  ON public.now_route_crossings(need_id)
  WHERE state IN ('PROPOSED','RECIPIENT_ACCEPTED','DONOR_ACCEPTED','REPORTED','CONFIRMED');
CREATE INDEX now_route_participations_expiry
  ON public.now_route_participations(state,expires_at);
CREATE INDEX now_route_crossings_state
  ON public.now_route_crossings(state,updated_at);

ALTER TABLE public.now_route_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.now_route_crossings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.now_route_participations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.now_route_crossings FROM PUBLIC, anon, authenticated;

-- Deliberately no SELECT/INSERT/UPDATE/DELETE policies for clients.
-- API bearer-key authorization, contention, moderation, replay protection,
-- and time-sensitive atomic transitions belong in the reviewed Edge/RPC code.
-- Migrating schema alone makes NO exchange live or accessible.
-- Deliberately no publication to supabase_realtime.
-- Strict retention/deletion policy and post-handoff dispute protocol are
-- prerequisites to real user participation.
