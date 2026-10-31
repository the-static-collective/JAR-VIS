# BUS FIELD OUTREACH 002 — Two crossings, four doors to knock on

**Owner/operator packet · October 31, 2026 · DRAFTS ONLY, NO OUTBOUND MESSAGES SENT.**

Companion to [Boundary Inhabitation 001](BOUNDARY-INHABITATION-001.md) and the **publicly live** [The Next Paper Issue 001](https://abundent.org/paper/001/), with a [print/share card](https://abundent.org/paper/001/field-card.html).

## Real request, deliberately narrow

The owner reports an immobilized 2008 International BE200 with a 6.4L MaxxForce 7 V8 and a failed ECM. The exact original ECM label and approved replacement have not been independently verified. We seek two separate optional resource transfers:

1. a **potentially compatible salvage ECM** from someone who may freely dispose of it (donation or other voluntary terms, after checking fit);
2. **temporary access to an appropriate RP1210 interface** and cables, subject to the owner’s willingness and return terms.

A diesel/Navistar technician validating compatibility is a *verification gate* rather than a fictional third transfer. If the ECM is not actually the problem, the scope should be corrected instead of pushing a mistaken repair.

**New source-backed technical lead:** Navistar programming bulletin **IK2600282** (2025), published as [NHTSA PDF](https://static.nhtsa.gov/odi/tsbs/2025/MC-11019110-0001.pdf), says 2007–2009 MaxxForce 7 V8 ECM units should have a **SID903** identifier and high-voltage sticker; look up the actual ECM part by VIN. Its NavKal workflow uses J1708 for *Save Request* and J1939 for *Program*. That informs the first verification questions but neither establishes that an ECM fits nor that a borrowed RP1210 interface is adequate. No VIN, firmware, credentials or sensitive address is published or sent here. NavKal may need licensed software and the correct OEM-approved calibration; unverified third-party firmware is not an endorsed repair path.

## The first four source-verified *prospects*, not partners

| Role | Public contact route | Why it might be relevant | Status |
| --- | --- | --- | --- |
| Technical verification | **North Central International**, 1955 W Howard Dr, North Mankato — parts department 507-625-2030. [Parts contacts](https://www.northcentralintl.com/parts-contacts-and-locations.htm) | International commercial dealership; can be *asked* about VIN-specific ECM part lookup and SID903, without assuming free service or a donated part. | UNCONTACTED |
| Salvage | **Misgen Auto Parts**, Ellendale — 507-684-2100, info@misgen.com. [Official site](https://www.misgen.com/) | Auto recycler and parts search; ask whether labeled International modules exist or a donor lead is known. No diesel ECM stock confirmed. | UNCONTACTED |
| Heavy-truck salvage | **Manders Diesel**, Lakeville — 952-469-1800, info@mandersdiesel.com. [Official contact](https://mandersdiesel.com/contact/) | Used heavy-truck and salvage inventory includes International trucks; ask about parts or referrals, not assuming a gift. | UNCONTACTED |
| Interface/technical expertise | **Streamline Onsite Repair**, Faribault — 507-210-6499. [Official services](https://streamlineonsiterepair.com/) | Services school buses and International diesel systems, with advertised electronic diagnostics. Ask whether they know the needed J1708/J1939 interface or can advise a loan/service path. No loan promised. | UNCONTACTED |

These four source-owned public business contacts are available for **read-only scouting** on the local JAR;VIS Recursive Workshop using `GET /api/boundary/field-scout-002`. It NEVER contacts any business. Every entry starts with `UNCONTACTED`; no shop has agreed to loan, donate, verify or sponsor anything.

## One-to-one outreach drafts (not transmitted)

### A. North Central International — part identity / technical gate
**Channel:** call parts department (507-625-2030) or reviewed individual email using their verified site. **Subject if emailed:** 2008 International MaxxForce 7 ECM — correct SID903 part lookup?

Hello,

I'm working on a repair for a 2008 International BE200 bus with a 6.4L MaxxForce 7 V8. The reported issue is its engine control module. Before we pursue a used replacement, could someone help identify the exact correct part-number family and any superseded units for this vehicle? I understand Navistar's IK2600282 mentions SID903 for these V8 ECMs.

What information would you need to check fitment and appropriate programming requirements? I can provide the private VIN/ECM label through an appropriate channel after confirming the process. A simple direction to the right technician or part resource would be helpful.

Thanks,
The Next Paper / Abundent · us@abundent.org

### B. Misgen Auto Parts — salvage label first
**Channel:** info@misgen.com (verified on official site); review recipient individually. **Subject:** Looking for a used Navistar MaxxForce 7 ECM label — 2008 bus

Hello,

I have a 2008 International BE200 school bus with a 6.4L MaxxForce 7. Before buying a replacement ECM, I'm checking whether an unused or salvage module might be a match. Do you have a donor vehicle or part lead with a **clearly readable ECM hardware label/part number**, or know another recycler to ask?

No need to remove or reserve anything yet; I need to verify exact fit and programming first. I'm exploring a low-cost salvage or voluntary-donation route if anything appropriate turns up. No donation is presumed.

Thanks for any direction,
The Next Paper / Abundent · us@abundent.org

### C. Manders Diesel — heavy truck salvage
**Channel:** info@mandersdiesel.com (verified official site); review individually. **Subject:** Salvage International MaxxForce 7 ECM / identification request

Hello,

I'm looking for possible salvage ECM leads for a 2008 International BE200 6.4L MaxxForce 7 bus. I know your yard handles dismantled heavy trucks, including International units. Do you know of anything in inventory or a retired vehicle with a readable ECM label that might be worth checking?

I don't have a confirmed interchange part number yet; compatibility must be established before removal or shipment. If this isn't a part you stock, even a referral would help.

Thanks,
The Next Paper / Abundent · us@abundent.org

### D. Streamline Onsite Repair — RP1210 and programming gate
**Channel:** 507-210-6499 (public service number). **Script for a single call:**

Hi. I'm trying to repair an immobilized 2008 International BE200 bus with a MaxxForce 7 V8. I already have the ECM removed and am trying to identify a safe replacement and programming path. I understand NavKal's programming workflow for this era may require J1708 and J1939.

Do you work on these ECMs, or could you point me toward someone who can verify the correct RP1210 interface, harness, driver, and supported software? I'm especially interested in temporarily borrowing appropriate equipment if somebody chooses to offer it, rather than having to buy it outright. No assumption that your shop lends tools—I'm looking for a technical lead or referral.

## Checkpoints — don't call a proposal a result

| Stage | Evidence to record (private if identifying) | Status |
| --- | --- | --- |
| Original ECU identification | ECM label photo / part number, private VIN lookup as needed | NOT VERIFIED |
| Specific replacement candidate | Exact donor part label, hardware revision, true interchange evidence | NONE CONFIRMED |
| Willing ECM donor | Consent and terms, after match | NONE CONFIRMED |
| RP1210 interface path | Exact model, cables, J1708/J1939 support, licensed program | NONE CONFIRMED |
| Willing lender / operator | Loan versus service, duration, responsible custody and return | NONE CONFIRMED |
| Safe programming decision | Qualified check of power, wiring, firmware provenance, service procedure | NOT APPROVED |
| Physical repair outcome | Genuine technician/owner witness of completed repair and test | NOT DONE |

When replies arrive, **don't put someone's contact details, VIN, exact bus location, original ECM serial, or correspondence into public GitHub or The Next Paper**. The independent email route `us@abundent.org` can handle private responses. JAR;VIS's Post Office demands verified recipients and per-message approval before any send, rather than treating a drafted prospect as consent.

## Public invitation remains separate from operator outreach

The publication at `/paper/001/` is a public *request* and a clearly labeled possible future. The real search requires individual willingness and technical proof. In the newspaper, a received lead is not a confirmed part; a confirmed part is not a transfer; a transfer is not a working bus.

**Next smallest move:** photograph/read the original ECM label for private cross-reference and make a **single** respectful call to the International parts desk. Then ask the salvage and mobile diesel contacts the smallest source-grounded question, and only consider equipment movement after compatibility is established.

**Laws:** CONTACT LEAD ≠ DONOR · SID903 ≠ MATCH · SHARED ENGINE FAMILY ≠ INTERCHANGEABILITY · RP1210 ≠ FLASH AUTHORITY · DRAFT ≠ SEND · REPAIR PLAN ≠ REPAIRED BUS.
