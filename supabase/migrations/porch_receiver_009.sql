-- PORCH-RECEIVER-009 — private, non-contact, revocable human intake.
-- No grants to anon/authenticated. JAR;VIS only proposes, operator owns disposition.
create table if not exists public.porch09_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('need','offer','question')),
  particular text not null check (char_length(particular) between 8 and 420),
  area text not null default '' check (char_length(area) <= 90),
  when_text text not null check (when_text in ('Whenever works','Soon, if possible','Just exploring')),
  next_step text not null default '' check (char_length(next_step)<=220),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  state text not null default 'PENDING' check (state in ('PENDING','HELD','REPLY_AVAILABLE','CLOSED')),
  reply_text text not null default '' check (char_length(reply_text)<=480),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);
create index if not exists porch09_items_queue on public.porch09_items (state,created_at);
create index if not exists porch09_items_expiration on public.porch09_items (expires_at);
comment on table public.porch09_items is 'PRIVATE Abundent human porch submissions; public-safe text only, NO CONTACT DETAILS, no publication or commitments; hashed receipt secret. 30-day retention.';
alter table public.porch09_items enable row level security;
revoke all on public.porch09_items from public, anon, authenticated;

create table if not exists public.porch09_events (
 id bigint generated always as identity primary key,
 item_id uuid not null references public.porch09_items(id) on delete cascade,
 event_type text not null check(event_type in ('RECEIVED','HELD','REPLY_PREPARED','CLOSED')),
 actor text not null check(actor in ('SUBMITTER','OPERATOR')),
 note text not null default '' check(char_length(note)<=160),
 created_at timestamptz not null default now()
);
create index if not exists porch09_events_item on public.porch09_events(item_id,created_at);
comment on table public.porch09_events is 'Private metadata-only observation receipts: not human outcome verification.';
alter table public.porch09_events enable row level security;
revoke all on public.porch09_events from public, anon, authenticated;
revoke all on sequence public.porch09_events_id_seq from public, anon, authenticated;

create table if not exists public.porch09_quotas (
  bucket text primary key check (length(bucket) between 6 and 180),
  used integer not null default 0,
  expires_at timestamptz not null
);
alter table public.porch09_quotas enable row level security;
revoke all on public.porch09_quotas from public, anon, authenticated;

create or replace function public.porch09_consume_quota(
  p_bucket text,p_expires timestamptz,p_max integer
) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare n integer;
begin
 if p_bucket is null or length(p_bucket) not between 6 and 180 or p_expires <= now()
  or p_max < 1 or p_max > 3000 then return false; end if;
 insert into public.porch09_quotas as q(bucket,used,expires_at)
 values(p_bucket,1,p_expires)
 on conflict (bucket) do update set
   used=case when q.expires_at <= now() then 1 else q.used+1 end,
   expires_at=excluded.expires_at
 where q.expires_at <= now() or q.used < p_max
 returning used into n;
 return n is not null;
end $$;
revoke all on function public.porch09_consume_quota(text,timestamptz,integer) from public,anon,authenticated;
grant execute on function public.porch09_consume_quota(text,timestamptz,integer) to service_role;
