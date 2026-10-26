-- BACKEND-007: scoped, revocable operator/worker capabilities and fenced returns.
-- This migration never stores raw bearer credentials; issuance is server-only.
create table if not exists public.jarvis_backend_capabilities (
  id uuid primary key default gen_random_uuid(),
  token_sha256 text not null unique check (token_sha256 ~ '^[a-f0-9]{64}$'),
  scope text not null check (scope in ('operator','worker')),
  actor text not null check (actor ~ '^[a-zA-Z0-9_-]{4,64}$'),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
comment on table public.jarvis_backend_capabilities is
  'BACKEND-007: SHA256 only, scoped bearer capabilities. Never expose raw key, table, or service role in browser.';
alter table public.jarvis_backend_capabilities enable row level security;
revoke all on public.jarvis_backend_capabilities from public, anon, authenticated;
grant select,insert,update on public.jarvis_backend_capabilities to service_role;

create or replace function public.jarvis_backend_issue_capability(
  p_scope text, p_actor text, p_days integer default 90
) returns text language plpgsql volatile security invoker set search_path = ''
as $$
declare raw text;
begin
  if p_scope not in ('operator','worker') or
     p_actor is null or p_actor !~ '^[a-zA-Z0-9_-]{4,64}$' or
     p_days is null or p_days not between 1 and 180 then
     raise exception 'INVALID_CAPABILITY_REQUEST';
  end if;
  raw := 'jv7_' || encode(extensions.gen_random_bytes(32),'hex');
  insert into public.jarvis_backend_capabilities(token_sha256,scope,actor,expires_at)
    values(encode(extensions.digest(convert_to(raw,'UTF8'),'sha256'),'hex'),
           p_scope,p_actor,now()+make_interval(days=>p_days));
  return raw;
end; $$;
revoke all on function public.jarvis_backend_issue_capability(text,text,integer) from public, anon, authenticated;
grant execute on function public.jarvis_backend_issue_capability(text,text,integer) to service_role;

create or replace function public.jarvis_backend_check_capability(p_token text,p_scope text)
returns jsonb language sql stable security invoker set search_path = ''
as $$
  select coalesce(
    (select jsonb_build_object('authorized',true,'actor',actor,'scope',scope,'expiresAt',expires_at)
     from public.jarvis_backend_capabilities
     where token_sha256=encode(extensions.digest(convert_to(coalesce(p_token,''),'UTF8'),'sha256'),'hex')
       and p_token like 'jv7_%' and length(p_token)=68
       and scope=p_scope and revoked_at is null and expires_at>now()
     limit 1),
    '{"authorized":false}'::jsonb);
$$;
revoke all on function public.jarvis_backend_check_capability(text,text) from public, anon, authenticated;
grant execute on function public.jarvis_backend_check_capability(text,text) to service_role;

create or replace function public.jarvis_backend_revoke_capability(p_actor text,p_scope text)
returns integer language plpgsql volatile security invoker set search_path = ''
as $$
declare n integer;
begin
  update public.jarvis_backend_capabilities set revoked_at=now()
  where actor=p_actor and scope=p_scope and revoked_at is null;
  get diagnostics n = row_count;
  return n;
end; $$;
revoke all on function public.jarvis_backend_revoke_capability(text,text) from public, anon, authenticated;
grant execute on function public.jarvis_backend_revoke_capability(text,text) to service_role;

create or replace function public.jarvis_backend_list_jobs()
returns jsonb language sql stable security invoker set search_path = ''
as $$
  select jsonb_build_object(
    'schema','jarvis.operator-jobs/v1',
    'mode','SYNTHETIC_ONLY',
    'summary',public.jarvis_backend_snapshot(),
    'jobs',coalesce((
      select jsonb_agg(j order by (j->>'createdAt') desc) from (
        select jsonb_build_object('id',id,'label',label,'status',status,
          'createdAt',created_at,'updatedAt',updated_at,'approvedAt',approved_at,
          'leaseUntil',lease_until,'worker',lease_owner,'attempts',attempts,
          'result',result) as j
        from public.jarvis_backend_jobs order by created_at desc limit 30
      ) s
    ),'[]'::jsonb),
    'receipts',coalesce((
      select jsonb_agg(r order by (r->>'seq')::bigint desc) from (
        select jsonb_build_object('seq',seq,'jobId',job_id,'kind',kind,'at',recorded_at,
        'observation',observation) as r
        from public.jarvis_backend_receipts order by seq desc limit 80
      ) s
    ),'[]'::jsonb)
  );
$$;
revoke all on function public.jarvis_backend_list_jobs() from public, anon, authenticated;
grant execute on function public.jarvis_backend_list_jobs() to service_role;

create or replace function public.jarvis_backend_return_fenced(
  p_id uuid, p_worker text, p_attempt integer, p_result jsonb
) returns jsonb language plpgsql security invoker set search_path = ''
as $$
declare j public.jarvis_backend_jobs%rowtype;
begin
  if p_result is null or jsonb_typeof(p_result)<>'object'
    or octet_length(p_result::text)>2048
    or p_result->>'schema'<>'jarvis.synthetic-return/v1'
    or p_result->>'requestId' <> p_id::text
    or p_result->>'verifiedRealWorldClaims' <> 'false'
    or p_result->>'admitted' <> 'false'
    or p_result->'externalEffects' <> '[]'::jsonb then
    raise exception 'INVALID_SYNTHETIC_RETURN';
  end if;
  update public.jarvis_backend_jobs
    set status='RETURNED',result=p_result,updated_at=now(),lease_until=null,lease_owner=null
    where id=p_id and kind='SYNTHETIC_MEASURE' and status='LEASED'
      and lease_owner=p_worker and attempts=p_attempt and lease_until>now()
    returning * into j;
  if not found then return jsonb_build_object('ok',false,'reason','FENCED_OR_EXPIRED'); end if;
  insert into public.jarvis_backend_receipts(job_id,kind,observation)
    values (j.id,'COMPUTE_RETURNED',jsonb_build_object('attempt',j.attempts,
      'verifiedRealWorldClaims',false,'externalEffects',0,'fenced',true));
  return jsonb_build_object('ok',true,'id',j.id,'state','RETURNED',
    'admitted',false,'verifiedRealWorldClaims',false);
end; $$;
revoke all on function public.jarvis_backend_return_fenced(uuid,text,integer,jsonb) from public, anon, authenticated;
grant execute on function public.jarvis_backend_return_fenced(uuid,text,integer,jsonb) to service_role;
