-- Fixed retention. Runs independently of site traffic; only PORCH09 tables are touched.
select cron.schedule(
  'porch-receiver-009-expiry',
  '43 4 * * *',
  $purge$
  delete from public.porch09_items where expires_at <= now();
  delete from public.porch09_quotas where expires_at <= now();
  $purge$
);
