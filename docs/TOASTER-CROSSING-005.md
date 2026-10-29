# CROSSING-005 — original-song WAV to genuine Haunted Toaster MP4

**Draft source-owned experiment.** Source: JAR;VIS MADDCL0WN #34, carried on JAR;VIS PR #35. Destination: original Haunted Toaster BETA #275, plus a separately reviewed Toaster-native bridge PR. No merge, deployment, grant submission or public media release.

A person asks JAR;VIS a question at `/slots`, explores six creative creatures, and explicitly KEEPs exactly one. The OFFER TO THE REAL TOASTER button exports a JSON file only after KEEP. The JSON includes the original question, local JAR;VIS rule answer, complete deterministic decision history, source policy, exact kept creature digest and family digest. **The JSON contains the user's question and answer in plain text: keep it private.** A digest-only public passport is a different file.

The original JAR;VIS verifier, `node tools/toaster-offer.mjs verify-file OFFER.json`, replays all the original local deterministic dealer decisions. It refuses tampering and missing KEEP. The offer does NOT provide audio, a native VisualScore, native Toaster KEEP, verified media rights, publication permission or field evidence.

If the kept creature is a **radio** or **drums** species, the original JAR;VIS source now synthesizes a genuine deterministic 48 kHz mono PCM16 WAV from the creature's actual notes or 16-step drum pattern:

```sh
node tools/creature-audio.mjs render-wav --offer OFFER.json --out original.wav
```

A local WAV receipt records exact sample count, sample rate, duration, SHA-256 bytes and creature identity. No model, Suno API, cloud account or external provider is involved. Kept non-audio species cannot masquerade as musical output.

The separate original Toaster source verifies a pinned unmodified original JAR;VIS checkout and the exact offer. It performs the original Toaster `createCandidateSession().generate` six-up, producing real native candidate PNG previews, VisualScore addresses and ResolvedTimeline hashes from a seed derived from the kept JAR;VIS specimen. The creative attributes in the foreign offer remain inspiration/provenance, NOT injected as allegedly native VisualScores.

```sh
node src/full-measure/scripts/stranger-native.cjs inspect --jarvis /exact/JAR-VIS --offer OFFER.json
node src/full-measure/scripts/stranger-native.cjs preview --jarvis /exact/JAR-VIS --offer OFFER.json --audio original.wav --out /new/native-six
node src/full-measure/scripts/stranger-native.cjs render --jarvis /exact/JAR-VIS --offer OFFER.json --audio original.wav --out /new/native-film --native-keep-index 2 --authorize I_KEEP_THIS_NATIVE_TOASTER_CANDIDATE
```

The last command is a **second, native human KEEP**, independent of JAR;VIS's earlier creative KEEP. It executes original Toaster `session.select`, `session.keep`, `executionForRender`, and `renderVideo`. The original renderer is responsible for the resulting MP4 and validated native receipt. `--out` must be a new directory outside source trees. Installation and FFmpeg follow the original Toaster package contracts.

This is not a claim of licensed third-party audio, independent human testimony, released film, venue booking, social posting or Voqal/MIT endorsement. Source audio requires applicable rights and consent. Separate source-owner integrations for non-audio manga, SVG, comic, postcard and storyboard artifacts remain future work. All applications remain editable drafts.

**The clown owns possibility. Source owners execute their own work. Human KEEP is never transferable or silently inferred.**
