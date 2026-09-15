# Talking Portfolio — Build Plan

An AI avatar of Avinash HM that a recruiter can **talk to**, using his real face and
his real voice, grounded strictly in his résumé.

**Status:** planning complete, blocked on assets (§7)
**Owner:** Avinash HM · **Branch:** `claude/magical-goodall-d3b1sx`

---

## 1. The goal, stated precisely

A hiring manager opens a link, clicks **"Talk to Avinash"**, speaks a question out loud,
and Avinash's face answers them — his features, his voice, lips in sync — in under two
seconds. They can also read everything as text, and leave with his résumé.

### Success criteria

| # | Criterion | Measure |
|---|---|---|
| S1 | Looks like him | Face is his real photo pixels; identity never regenerated |
| S2 | Feels responsive | < 2.0 s from end-of-speech to first audible word |
| S3 | Lip-sync holds up | Viseme onset within ±80 ms of audio; no flapping on silence |
| S4 | Cannot lie | Zero claims not present in the source corpus |
| S5 | Cannot be drained | Hard daily spend cap; per-IP rate limit |
| S6 | Works for everyone | Full text fallback; no mic, no WebGL, no JS → still usable |

### Explicit non-goals

- Not indistinguishable from filmed video. It is a **living portrait**, and says so.
- Not a general chatbot. It answers about Avinash, and declines everything else.
- Not a replacement for the résumé. It links to it constantly.

---

## 2. What the recruiter actually experiences

```
      ┌─────────────────────────────────────────┐
      │   [ his real face, breathing, blinking ]│
      │                                         │
      │   ● AI avatar of Avinash HM             │   ← always visible
      └─────────────────────────────────────────┘
        "Tell me about your quantization work"     ← their speech, transcribed live
        ─────────────────────────────────────────
        ▸ he speaks the answer, lips in sync
        ▸ same answer appears as text beneath
        ▸ source chip: "IEEE ICIICS-2026"          ← every claim is attributable

        [ suggested: What did you do at Jio? ]     ← so they never face a blank prompt
        [ suggested: Are you available now?   ]
        [ Download résumé ]  [ Email him ]
```

Opening state matters: the avatar is **already alive and idling** before any interaction,
with three suggested questions visible. Nobody is asked to talk to a still image.

---

## 3. Architecture

```
 BROWSER                                   VERCEL (keys live here, never in client)
 ┌────────────────────────┐                ┌──────────────────────────┐
 │ mic ──► STT            │───transcript──►│ /api/chat                │
 │                        │                │   grounded LLM           │
 │ FaceRenderer (WebGL)   │◄──visemes──┐   │   OpenRouter → Gemini    │
 │   real photo textures  │            │   ├──────────────────────────┤
 │   viseme blend + warp  │            └───│ /api/tts                 │
 │   idle: blink/breathe  │◄──audio────────│   ElevenLabs cloned voice │
 │                        │                │   + char timestamps      │
 │ text transcript + UI   │                ├──────────────────────────┤
 └────────────────────────┘                │ /api/stt-token           │
                                           │   AssemblyAI temp token  │
                                           ├──────────────────────────┤
                                           │ rate limit · spend cap   │
                                           │ kill switch              │
                                           └──────────────────────────┘
```

### Component decisions and why

| Layer | Choice | Why this, not the alternative |
|---|---|---|
| **Face** | Real photo, WebGL mesh warp + multi-photo viseme blending | Only approach that keeps 100% facial identity. 3D avatars rebuild him as a game character; generative video drifts features between frames. |
| **Lip-sync** | ElevenLabs character timestamps → phoneme → viseme schedule | Browser TTS fires only word/sentence `boundary` events — no phonemes — and exposes no raw audio, so neither timing nor waveform analysis is available. This was the fatal flaw in the original stack. |
| **Voice** | ElevenLabs instant clone | It's his voice, and the timestamps double as the lip-sync source. A stranger's voice from his face destroys the illusion faster than any visual flaw. |
| **STT** | Web Speech API first, AssemblyAI streaming as upgrade | Web Speech is free and instant but Chrome-only and mediocre. AssemblyAI temp tokens (1–600 s, single use) let us upgrade without exposing the key. |
| **Brain** | OpenRouter → Gemini Flash, hard-grounded | Cheap, fast, good enough. The grounding regime (§5) matters far more than the model. |
| **Host** | Vercel free tier + serverless functions | Only way to hold keys safely while staying publicly open. |

### Interfaces to keep swappable

Every risky dependency sits behind a small interface, so none of them is a one-way door:

- `VisemeSource` → `{ visemes: [{t, viseme, weight}], audio }` — ElevenLabs today, Azure or an offline aligner later.
- `Brain` → `ask(question, history) → {answer, sources[]}` — LLM today, local retrieval offline.
- `FaceRenderer` → `setViseme(v, weight)`, `blink()`, `setMood()` — 2D portrait today; a photoreal video renderer could drop in later without touching the conversation engine.

---

## 4. The face, in detail

This is the part that decides whether the whole thing works.

### Source textures
Four aligned photographs (§7), registered to the neutral shot by a 2-point similarity
transform on the eye centres, so the head never appears to jump.

### Viseme set
The 15 Oculus/Preston-Blair visemes: `sil PP FF TH DD kk CH SS nn RR aa E I O U`.

### How a mouth shape is made
1. **Outside the mouth region the neutral photo is never touched.** His identity is
   structurally protected — eyes, nose, hairline, jawline are always his real pixels.
2. Inside a soft-edged mouth mask, the four source textures are **blended** per viseme
   (`aa` pulls from the open-mouth shot, `E` from the smile, `O` from the rounded shot).
   Real teeth, real lip interior, real shadow — not synthesised.
3. A **geometric warp** covers the in-between shapes: jaw drop with falloff toward the
   ears, lip corner pull, lip rounding.
4. **Coarticulation**: visemes ease into each other over ~60 ms rather than snapping,
   and adjacent visemes influence each other. This is the difference between "talking"
   and "chewing".

### Idle life (runs always, even when silent)
Blinks on a randomised 3–7 s interval with realistic 120 ms closure · micro head motion
(±2° yaw/pitch on Perlin noise) · breathing scale · brow raise on questions · gaze
settling. Without these the face reads as dead between sentences.

### Calibration
A hidden calibration panel (press `C`) lets anchor points — mouth corners, jaw line,
eye centres — be dragged and saved as JSON. Defaults will be set by hand and verified
by screenshot; calibration guarantees exactness rather than relying on my estimate.

---

## 5. Grounding: the avatar must not be able to lie

The most serious risk in this project is not that it looks fake. It is that an LLM
wearing his face invents a job he never had, in a hiring conversation. That is a
material misrepresentation to an employer.

**Controls, in order of strength:**

1. **Closed corpus.** A structured `corpus.json` built from the résumé — every role,
   figure, date, project, credential — is the only factual source in the prompt.
2. **Refusal by default.** The system prompt requires: state only what is in the
   corpus; if it is not there, say so plainly in his voice
   (*"That's not something I've worked on."*). Never estimate, never infer a skill.
3. **Attribution in the UI.** Every answer renders a source chip naming where the claim
   comes from. Unsourced sentences are visually flagged.
4. **Post-check.** A server-side validator scans each answer for numbers, company names
   and technologies absent from the corpus and rejects the response, retrying once.
5. **Human-supplied answers for the gaps.** Salary, notice period, relocation and visa
   are *not in the résumé*. These come from a hand-written FAQ he authors (§7), not from
   the model.

**Disclosure** is non-negotiable and permanent: a visible "AI avatar of Avinash HM"
badge, an opening line that states it is an AI trained on his résumé, and a link to
reach the real person. This protects him legally and, more importantly, it is what a
recruiter deserves to know.

---

## 6. Cost and abuse control

| Item | Cost | Notes |
|---|---|---|
| ElevenLabs | ~$5/mo | Starter; instant voice clone + timestamps |
| OpenRouter (Gemini Flash) | ~$1–3/mo | Grounded answers are short |
| AssemblyAI | free tier → ~$0.15/hr | Only if we upgrade from Web Speech |
| Vercel | $0 | Free tier is sufficient |
| **Expected total** | **~$6–10/mo** | Within the agreed $5–20 ceiling |

**Abuse controls:** per-IP rate limit (20 turns / 10 min) · max 60 s of TTS per session ·
hard daily spend cap with graceful degradation to text-only · `PAUSED` env kill switch ·
answer length capped so a prompt-injection attempt cannot generate expensive output.

---

## 7. Assets required from Avinash — **blocking**

### 7.1 Photographs (4 shots, ~2 minutes)
Same position, same light, same distance, camera on a surface, do **not** move between shots.

| # | Shot | Purpose |
|---|---|---|
| 1 | Mouth closed, neutral — *the passport photo works* | Base identity texture |
| 2 | Mouth open, teeth visible — say "**aah**" | `aa`, `E`, jaw-open visemes |
| 3 | Wide smile, teeth — say "**eee**" | `I`, `E`, smile shapes |
| 4 | Lips rounded — say "**ooo**" | `O`, `U`, `RR` shapes |

> ⚠️ The passport photo must be sent **as a file attachment**, not pasted into the chat.
> The pasted version is not written to disk and cannot be loaded by a web page.

### 7.2 Voice sample (~90 seconds)
Quiet room, phone held ~20 cm away, natural pace — read anything, ideally his own
professional summary so the clone learns his technical pronunciation. One continuous
take is better than several short ones.

### 7.3 Answers the résumé cannot provide
Needed as plain text; these become the hand-written FAQ:
notice period · current and expected compensation · willingness to relocate · remote vs
onsite · visa/work authorisation · what he wants next · why he's looking.

### 7.4 Accounts
ElevenLabs · OpenRouter · Vercel · (optional) AssemblyAI. He creates them; keys go into
Vercel environment variables and are never committed.

---

## 8. Build phases

| Phase | Deliverable | Depends on |
|---|---|---|
| **0 — Foundation** | Repo structure, Vercel project, `corpus.json` from the résumé, static shell | — |
| **1 — Face rig** | Photo alignment, mouth mask, viseme blending, idle motion, calibration UI | §7.1 |
| **2 — Voice** | ElevenLabs clone, `/api/tts`, timestamps → viseme schedule | §7.2 |
| **3 — Brain** | `/api/chat`, grounding, post-check validator, FAQ | §7.3 |
| **4 — Ears** | Mic capture, STT, barge-in, silence detection | — |
| **5 — Shell** | Surrounding portfolio, transcript, résumé download, mobile, a11y | — |
| **6 — Harden** | Rate limits, spend cap, fallbacks, cross-browser, deploy | all |

Phases 0, 4 and 5 are unblocked and can start immediately. **Phase 1 cannot start
without the photographs.**

---

## 9. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Uncanny valley on open mouth | High | Real mouth pixels from shot #2 rather than synthesis; conservative jaw range; subtlety over range |
| Model states something untrue | **Critical** | §5 — closed corpus, refusal default, post-check validator, sourced UI |
| Lip-sync drift on long answers | Medium | Re-anchor schedule to `audio.currentTime` every 250 ms |
| Latency over 2 s feels dead | Medium | Stream LLM tokens; start TTS on first sentence; idle "thinking" motion |
| Safari/iOS audio autoplay blocked | Medium | Audio unlocked by the click that starts the conversation |
| Cost spike from sharing | Medium | §6 caps, degrade to text rather than fail |
| Recruiter has no mic or won't speak | Medium | Typed input is a first-class path, not a fallback |

---

## 10. Open questions

1. **Photo lighting** — the passport shot has flat studio light. If the new shots are
   taken in different light, the mouth region will not blend cleanly. Best is to retake
   all four together in the same session, including the neutral.
2. **GitHub username mismatch** — the résumé says `Avinashhmavi`; this repo is
   `avinashavihm`. Which is canonical?
3. **Language** — English only, or should it answer in Kannada/Hindi if asked?
4. **Where does this sit** — is the talking avatar the entire site, or the centrepiece
   of a fuller portfolio page?

---

## 11. Decision log

- **2026-09-15** — Avatar renderer: real-photo animated portrait. Rejected 3D avatar
  (loses likeness) and photoreal streaming ($3–6/min, unbounded exposure).
- **2026-09-15** — Browser TTS rejected: no phoneme/viseme events, no raw audio access.
  ElevenLabs adopted for voice *and* lip-sync timing.
- **2026-09-15** — Vercel + serverless adopted; keys must never reach the client.
- **2026-09-15** — Disclosure badge and closed-corpus grounding are non-negotiable.
