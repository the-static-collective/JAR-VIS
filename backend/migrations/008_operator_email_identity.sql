CREATE TABLE IF NOT EXISTS public.jarvis_backend_operator_identities (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
 email text NOT NULL UNIQUE CHECK(email=lower(email) AND length(email) BETWEEN 5 AND 254),
 actor text NOT NULL UNIQUE CHECK(actor='primary_operator'),
 created_at timestamptz NOT NULL DEFAULT now(),
 revoked_at timestamptz
);
ALTER TABLE public.jarvis_backend_operator_identities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.jarvis_backend_operator_identities FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.jarvis_backend_operator_identities TO service_role;
