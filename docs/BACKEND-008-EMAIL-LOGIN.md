# BACKEND-008 — Keys belong to machines; doors belong to people

**2026-10-26:** Additive email-first operator login is deployed as a **separate Supabase Edge Function**; JAR;VIS 007 key login is unchanged and remains the fallback until this is independently validated.

## New doorway

https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/jarvis-operator-008

Owner experience: supply a private `jv7_` operator key **once**, and your own email; receive a one-time 6-digit email code; finish enrollment. Future sign-ins use email codes and refreshable HttpOnly browser cookies rather than copy/pasting infrastructure keys.

This is **not** a shared-password login or a claim that email by itself creates operator authority. A verified email account **and** a previously authorized JAR;VIS 007 key are required for initial identity binding. A unique database constraint prevents linking a second account to the sole `primary_operator` role. Future actions recheck verified Supabase Auth identity and a private unrevoked operator membership on every request.

## Bootstrap (user)

1. Finish creating the 007 operator key in your Supabase SQL Editor, as already instructed. Keep it private.
2. **One project-wide email configuration** may still be necessary: Supabase Dashboard → Authentication → Email Templates → **Magic Link** → replace the mail body with a short code template containing `{{ .Token }}` (e.g. `<p>Your one-time sign-in code: {{ .Token }}</p>`). Supabase sends a **Magic Link** by default otherwise, which this initial 008 interface does **not** consume. This template setting affects passwordless sign-ins throughout this Supabase project; review other apps first.
3. Email delivery uses Supabase Auth, **not yet Abundent's verified Resend account**. Supabase's default email sender may be restricted; if a requested code doesn't arrive, configure a custom SMTP sender in Supabase Auth using the project's private dashboard. Do not put SMTP or API credentials in GitHub/chat.
4. Open the new 008 link and enter your own email and the newly issued `jv7_` key for first login. Receive a one-time email code, type it, and open the task panel.
5. Thereafter: normal sign-in requires only your email and a one-time code. Browser cookies are Secure, HttpOnly, SameSite=Strict, scoped to the exact function path. The server refreshes a short-lived access session using a rotating refresh token.
6. Keep the old 007 key until successfully testing **the entire email→code→operator queue** sequence. After verification, revoke or shorten the old key separately. Never paste it into conversation.

## Security / operations

- `public.jarvis_backend_operator_identities` is RLS-closed and `anon`/`authenticated` have no table privileges; it contains identity UUID, normalized email and one role marker, no plaintext operator bearer key.
- Initial join requires the existing 007 operator **scope** and specifically actor `primary_operator`. Email must be verified by Supabase Auth; `auth.getUser(access_token)` validates the identity on the server. Missing or revoked membership denies operator work.
- Any unauthenticated browser can reach only the login shell and request a code **for an already enrolled operator email**; registering an unrecognized email requires the existing key. Supabase Auth rate limits OTP requests and verification.
- Frontend never sees the service-role key, refresh token, or JWT via JavaScript; all sessions use HttpOnly cookies. Login bootstrap key stays only in the tab until the verification attempt, then is cleared. CSRF is blocked with strict same-origin POST checks.
- Only synthetic `view`, `enqueue`, `admit` are available after sign-in. All mail, publication, peer onboarding, real-world help, and Modal worker dispatch remain separate gates.
- Worker keys are still the existing **scoped, revocable BACKEND-007 credentials**; automation of their issuance is a later internal service feature, not available in this build. Do **not** grant Supabase service-role to Modal or a browser.
- The route is deployed in isolation; **email delivery and cookie login have not yet been field-tested**. Do not claim 'passwordless login verified' until the owner confirms it on their device.
- Existing 007 operator panel: https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/jarvis-operator-007
- Check the Supabase Dashboard's Auth provider settings and email policy before changing shared Auth templates. Changes to Supabase Auth sender settings can affect other functions on the same project.

## Operator revocation (admin only)

In a privileged Supabase session, revoke `public.jarvis_backend_operator_identities` membership by UUID or email as needed. Every 008 operation checks the membership afresh, so revoked identities lose operator rights immediately even if the auth session remains valid. The old 007 key remains independently revocable with `jarvis_backend_revoke_capability`. Do not delete real user accounts as a substitute for controlled revocation.

**Witness status:** Migration applied, Supabase Edge Function reports ACTIVE v1. First true login/SMTP/code round-trip remains unverified. Tests cover validation, origin, cookies and backend wiring.
