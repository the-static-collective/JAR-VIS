# JAR;VIS-025 — Eagle Eye learns where to look

**State:** Source-owner review branch stacked on JAR;VIS-024 Investigation Desk, not merged/deployed.

### New behavior
The operator enters an ordinary question and presses **Find the right sources**. The original **ALEX-025** research organ classifies it using a small, inspectable local vocabulary. It returns an ordered recommendation set (and why) without any network request. The operator chooses the proposed providers with **Use these suggestions** or selects providers manually. Only then does **Investigate** send the question to the selected public services.

Seven available public sources:

| Provider | What it returns | Verification |
| --- | --- | --- |
| Collective GitHub | Public project sources, exact blob/commit/line evidence | Original ALEX-024 Git blob verifier |
| Wikipedia | Public encyclopedia search index | Discovery lead only |
| OpenAlex | Academic citation index | Metadata lead only |
| **Global GitHub** | Public GitHub repositories beyond the Collective | Public repository index; no arbitrary code execution |
| **Crossref** | DOI metadata for scholarly publications | DOI/index lead; no article authentication |
| **Open Library** | Books and authors | Catalog lead; no full text |
| **Europe PMC** | Biomedical publications and preprints | Metadata lead; no full text |

Search scope is **max four** public providers, selected per request. A public book search need not use GitHub at all. All data access is GET to audited HTTPS API hosts, per-service errors are retained. Arbitrary provider URLs, private connectors and private GitHub repositories remain blocked. This is not an unrestricted web crawler and the router's vocabulary can miss relevant providers.

The original finite **MOTIF-023** deeper reasoning remains optional for Collective GitHub; it preserves original planZ/GRAFT source code, the source-genealogy HOLD, and human review. Supplemental metadata is never admitted as MOTIF source custody without its own verification. Original ALEX-024, ALEX-023, planZ-023, GRAFT-023 donor source files are preserved unchanged and source-pinned, as is the added ALEX-025 provider router. Eight imported code blobs are verified before public research queries.

### Run
```sh
npm test
npm start
# http://127.0.0.1:7789/investigate
```

The source selection API is `POST /api/investigate/suggest`, protected by existing localhost Host/Origin and anti-CSRF checks. It performs **zero external calls**; `POST /api/investigate` performs only the user-selected public searches and may return a JSON packet that the user can explicitly download. Inputs are not automatically saved or sent to private providers. API tests cover source suggestions, no-network routing, new sources, privacy, forged provider choices, source-owner byte pins, and browser controls.

**Next real frontier:** a pluggable provider manifest and permission-scoped connectors for non-public material, with consent/retention rules; not silently giving any engine access to arbitrary accounts.
