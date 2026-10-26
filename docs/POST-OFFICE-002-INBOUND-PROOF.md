# POST OFFICE 002 — The first inbound letter returned

**Field date:** 2026-10-26 (Central time)  
**Status:** user-witnessed inbound delivery; outbound provider onboarding remains HOLD.

## Observations, separately attributable

1. **Porkbun forwarding provisioned:** `us@abundent.org` routes to the owner's chosen Proton Mail inbox. Destination address is intentionally omitted from this public repo.
2. **Live Cloudflare zone readback:** apex MX `fwd1.porkbun.com` priority 10, `fwd2.porkbun.com` priority 20; apex SPF `v=spf1 include:_spf.porkbun.com ~all`.
3. **User's direct field witness:** the owner sent an independent real email to `us@abundent.org` and reported receipt in Proton Mail: “i sent the test / it worked!” This is a **human-reported end-to-end success**, not an independent inbox/API observation and not an outbound send proof.
4. **DMARC initialized:** Cloudflare TXT `_dmarc.abundent.org` = `v=DMARC1; p=none; adkim=r; aspf=r`. This is an observation-only policy, **not DMARC enforcement, authentication of actual sent messages, or verification of an email sender**.
5. **Public return door:** webZ landing page now includes a plain `mailto:us@abundent.org` link. Source proof: https://github.com/the-static-collective/webZ/pull/141 . Its full automated offline/browser suite passed and commit `aa1baed4cd191144586feca4296630c37becec9a` is merged. Vercel reported deployment `dpl_F83ubWkG5tneaNriLFc21i8fEKnn` as READY, target production, sourced from that commit; apex domain is assigned and verified in Vercel. External device delivery/browser interaction remains separately testable.

## Remaining distinction

**Receiving ≠ sending.** A Proton Mail reply will ordinarily expose its original Proton sender. Porkbun forwarding does not grant Send-As for `us@abundent.org`. Existing JAR;VIS Post Office code supports Resend API mail, but no Resend account authorization, verified outbound domain or server-side API key has been established. Do not send messages from speculative aliases, disclose secrets in public files, or claim a scheduled send exists.

## Next gate: a verified sender, with no MX disruption

**Recommended sender service:** Resend. As of August 25, 2026, Resend reports a free tier with **three verified domains**; pricing and quotas should be confirmed at onboarding.

1. The human authorizes and connects a Resend account. Vercel Marketplace offers a Resend integration that can create its API key and attach `RESEND_API_KEY` to a chosen project; the owner chooses the project. Installing the integration does not automatically configure the local JAR;VIS script.
2. In Resend Domains, add `abundent.org`. Copy the **actual** DKIM and sending return-path/MX/SPF records generated for the selected region. Do **not** guess DKIM key, region-specific SES endpoint or record labels.
3. Inspect the live Cloudflare DNS before creating any records. **Preserve apex Porkbun MX records and its SPF** so `us@` keeps receiving. Resend typically uses a separate `send` subdomain for its return path. Avoid a second apex SPF record. If Resend instructs changing an apex record, stop and review the effect first.
4. Publish only the provider-provided sending DNS records through Cloudflare, verify the domain in Resend, and check signing/alignment.
5. Set the controlled sender `The Static Collective <us@abundent.org>` and Reply-To `us@abundent.org`. Keep API credentials in secret storage, not GitHub, chat messages, client JavaScript or recipient lists. Connect those secrets to a server-side operator path using a separate authenticated control.
6. Run one **self-test** to the owner's inbox first. Record API acceptance, actual Proton inbox arrival, the displayed From and Reply-To, and an actual two-way reply. Preserve a private provider receipt. Only then authorize named, permissioned personal follow-ups from the existing drafts.

**Outbound test subject:** `The Static Collective — Post Office proof 001`  
**Body:** `The first Abundent Post Office letter. If this arrives showing us@abundent.org, please reply to confirm the return route. This is an intentional self-test.`

## Next release tests

- no recipient list in repo;
- private draft/approval/scheduling only;
- operator approval per recipient;
- bounce/suppression handling before repeating sends;
- newsletter broadcasts only to independently opted-in subscribers with working unsubscribe;
- provider-accepted `!=` delivered `!=` replied.

**Current truth:** a working inbound correspondence address with owner-witnessed receipt; an open path toward an outbound-verified sender; no outside correspondence sent or scheduled.
