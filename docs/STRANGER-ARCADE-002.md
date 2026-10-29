# Native Stranger Arcade operator

The new `tools/stranger-arcade.mjs` pins CANNON PR #49 and checks exact source bytes plus #47/#45/#38/#37/#5 ancestry before invoking its local CLI. The original #28 source lock and operator remain compatible; the source inspector now accepts an explicit immutable lock for this second operator.

```sh
node tools/stranger-arcade.mjs inspect --cannon ../cannon002
node tools/stranger-arcade.mjs acquire --cannon ../cannon002 --into ../arcade-inputs
node tools/stranger-arcade.mjs build --cannon ../cannon002 --config ../arcade-inputs/config.json --out ../machine --authorize LOCAL_FICTIONAL_ONLY
node tools/stranger-arcade.mjs verify --cannon ../cannon002 --config ../arcade-inputs/config.json --out ../machine
node tools/stranger-arcade.mjs serve --cannon ../cannon002 --config ../arcade-inputs/config.json --out ../machine --sessions ../sessions --port 7792
```

Open http://127.0.0.1:7792/first-boot.html. Fixed local challenges execute original native code and emit independently replayable artifacts. Standalone HTML explicitly HOLDs unavailable native actions. No external dispatch, private intake, hardware control, institutional authority, spending or deployment is granted.

Verified runtime: Linux x86_64, Node24+, Python3.11+. Exact owner pins, runtime package hashes, source/native coverage and limitations travel in CANNON's manifest. Retained evidence remains unsigned software evidence. Human safety, rights, field and institutional gates remain unfulfilled.
