# Talking portfolio — working prototype

Open `app/index.html`. Single self-contained file; no server, no network, no keys.

- **Face** — `assets/portrait.jpg`, Avinash's real photograph. Outside the mouth
  region its pixels are never modified, so facial identity is preserved exactly.
  Only geometry is warped, plus a synthesised mouth interior.
- **Brain** — retrieval over a closed corpus (`src/corpus.js`). It can only ever
  speak sentences written by hand from the résumé, so hallucination is
  structurally impossible on this path.
- **Voice** — browser speech synthesis (placeholder). Replaced by the ElevenLabs
  clone in phase 2; `src/speech.js` is the only file that changes.
- **Lip-sync** — `src/visemes.js` builds a per-character schedule and re-anchors
  it on each `boundary` event to stop drift.

Press **C** over the avatar to open anchor calibration and drag the mouth, jaw
and eye positions; it prints JSON to paste into `index.tpl.html`.

## Build
    npm install
    npx esbuild app/src/main.js --bundle --format=esm --minify --outfile=app/app.js
    node app/inline.cjs
