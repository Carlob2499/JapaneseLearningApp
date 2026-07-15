# Decision Log

Standing decisions and directives that must survive across sessions. The repository is the
single source of truth; anything decided in conversation gets recorded here or it doesn't exist.

Format: date, session, decision, source.

---

## 2026-07-11 — Session 1

### D-001: Stack and deployment (from project brief)
Vite + React + TypeScript installable PWA. Static deploy to **GitHub Pages via CI** — no backend.
IndexedDB for progress/SRS state; localStorage for settings only. Offline-capable (manifest,
service worker, versioned precache synced with build output). Content as data: typed,
Zod-validated JSON packs fully separated from game logic.
*Source: project brief, Session 1.*

### D-002: Content integrity architecture (from project brief — non-negotiable)
Generated language content is banned. All language data pipeline-imported from licensed open
datasets with provenance in pack metadata: JMdict (CC BY-SA), KANJIDIC2 (CC BY-SA), KanjiVG
(CC BY-SA), Tatoeba (CC BY). JLPT level tags are community-estimated (no official post-2010
lists exist) and the app must say so. Grammar points curated per level with source citations.
Model-written content (drill prompts, distractors, story text) allowed only *around*
dataset-verified items, never as the source of readings, meanings, or usage. Every pack
carries license attribution and verification status; CI validates schemas.
*Source: project brief, Session 1.*

### D-003: Visual/animation direction — carry forward prior-repo learnings
User directive at Session 1 plan approval: reuse the visual learnings from previous
repositories — specifically **GSAP** for animation/visual polish, and the established
**Node.js toolchain → GitHub Pages** static-deploy pattern. To be applied in Session 3
(design proposals should assume GSAP-grade motion design) and Session 4+ (build).
*Source: user instruction, 2026-07-11 plan approval.*

### D-004: Session cadence (from project brief)
One phase per session; do not skip ahead. Session order: 1 research → 2 curriculum &
real-world scope → 3 design proposals (user picks one) → 4+ architecture then iterative
build. Every session ends with done / verified / remaining.
*Source: project brief, Session 1.*

### D-005: JLPT level-tag provenance policy (Session 2 research outcome)
No official N5–N1 lists exist (official guidebook FAQ Q7, 2009 — see docs/curriculum.md §2).
Primary tag source: Jonathan Waller's JLPT Resources (CC BY), imported via counted GitHub
mirrors (elzup/jlpt-word-list, davidluzgouveia/kanji-data, stephenmk/yomitan-jlpt-vocab),
cross-checked and resolved against JMdict entries. Estimate spread across sources is
disclosed in-app and in pack metadata (`levelTagSource`, `levelTagLicense`, `verification`).
JEV and VDRJ are calibration references only — JEV forbids redistribution; neither enters
the repo. Grammar: no importable open inventory exists; we curate our own ~850–950-point
list with per-point level placement cross-referenced against ≥2 public inventories and a
textbook anchor — counts citable, lists not copyable (Bunpro/JLPT Sensei are proprietary).
*Source: Session 2 research, 2026-07-11.*

### D-006: Selected game concept — A · Hikkoshi (user decision)
From the three Session 3 proposals (docs/design-options.md), the user selected
**Concept A — 「引っ越し」 Hikkoshi: A Life in Japan** (life-sim calendar: daily errands
as disguised drills; life stages Tourist → Resident → Part-timer → Employee → Senior
staff → handling it for someone else as the six-level progression). The shared engine
E1–E8 from design-options.md is the build target. Concepts B/C remain future modes on
the same engine. Known accepted trade-off (recorded from the comparison matrix): broadest
art/scene authoring bill of the three — mitigation via template scenes and a stylized
fixed-perspective look; scene variety must outpace the "wears thin" failure mode (P1).
*Source: user selection at Session 3 gate, 2026-07-11.*

### D-007: Content pipeline — data source & tag-join policy (Session 4 build)
Ingestion adapts judgment-call #1 of the approved plan: the pipeline imports the **canonical
EDRDG XML** (JMdict_e.gz, kanjidic2.xml.gz) directly rather than scriptin/jmdict-simplified
JSON. Reason: jmdict-simplified data ships only as github.com release assets, which are
egress-blocked in this build environment (ftp.edrdg.org is reachable). Reading the raw,
unexpanded XML also sidesteps the entity trap — POS short codes (`&n;`→`n`) are literal in
the file. Net effect: more first-party provenance, no XML-entity risk, Node built-ins only
(tar/jmdict-simplified deps dropped). Data is CC BY-SA 4.0 (Breen/EDRDG); the EDRDG licence
page is re-verified at fetch time and fails the build on change.

Tag-join direction (D-002-sound): the community JLPT list drives pack membership + estimated
level (elzup vocab CSVs; davidluzgouveia `jlpt_new` kanji; N5→L1 … N1→L5); JMdict/KANJIDIC2
supply the verified reading/senses/meanings. Match is exact on expression+reading (expanding
`A; B` / `～` list variants to clean forms) then unique reading-only; anything unresolved goes
to `content/review-queue.json`, never guessed. First run: vocab 97.6% resolved (7,660 items,
192 queued), kanji 100% (2,211). Emitted output is deterministic (dates from fetch time).
Tatoeba sentences and KanjiVG stroke assets are deferred to the next session.
*Source: Session 4 build, 2026-07-11; approved plan + discovered egress constraint.*

### D-008: Content pipeline v2 — Tatoeba sentences + KanjiVG strokes (finish the datasets)
Completes the brief's "content pipeline first" datasets (user directive: include the out-of-scope
KanjiVG work alongside Tatoeba). Both hosts are reachable through the egress proxy (verified), unlike
github.com release assets.
- **Tatoeba**: minimal ~29 MB set via `per_language/jpn` (jpn_sentences_detailed + jpn-eng_links +
  eng_sentences + CC0 subset); bz2 via `bzip2 -dc`. `ja`/`en` copied verbatim (D-002). **Leveling is
  tokenizer-free kanji-coverage** — lowest level whose cumulative known-kanji set covers every kanji
  in the sentence (kana-only → L1; untaught kanji → excluded); disclosed in `coverage.knownRatioBasis`.
  Grammar/vocab difficulty not modeled (future kuromoji pass). Filters: English pair required, length
  4–50, dedupe, 600/level cap. Result: 3,000 sentences (600/level; cap binds), 99.2% links resolve.
  License CC-BY-2.0-FR (CC0-1.0 subset marked per item).
- **KanjiVG** (`StrokeItem` + `strokes` domain, per-level packs): release zip/codeload are egress-
  blocked, so fetch per-character SVGs from `raw.githubusercontent.com/KanjiVG/kanjivg/r20250816/
  kanji/{cp}.svg` (jsDelivr fallback), pool of 8 + retry + tag-keyed disk cache; extract ordered
  stroke `d` paths + the 109×109 viewBox. Result: 2,211 kanji, 0 unmatched (100%). License
  CC-BY-SA-3.0 (Apel; ShareAlike). Recorded in the lock by the build step.
- **UI stroke rendering + precache wiring are out of scope** (build-order item 5). This session ships
  the validated DATA: 20 packs / 15,082 items total.
*Source: Session 5 build, 2026-07-11/12; approved plan + reachability recon.*

### D-009: Playable vertical slice — first interactive study loop (L1)
The app now loads real content and is usable (user asked "can I try it?"). Decisions:
- **Pack delivery = dynamic `import()` of the L1 JSON packs** (Option A) — Rollup code-splits each into
  a hashed async chunk the existing workbox glob auto-precaches (offline works; precache 775 KB).
  Higher levels migrate to fetch+runtime-cache when the "download for offline" UX lands.
- **Runtime `Pack.parse` validation** of loaded packs (D-002 enforced at runtime); `zod` enters the app bundle.
- **SRS = the architecture §5 stage ladder, simple**: `src/scheduler/srs.ts` pure functions
  (pass +1 / fail −2 min 1 + lapse / partial holds; ladder 4h→…→5mo). Nudge/load-shaper/leech and the
  golden 180-day tests are deferred to the full-scheduler session.
- **Store = `idb`** (direct dep): `itemStates` + append-only `journal` in IndexedDB (progress on-device;
  D-001). **Nav = `useState`** view switch (no router yet).
- **One Review flow** (due + ~12 newly-introduced, interleaved) with an untracked "practice more"
  fallback so it's satisfying on first open. **Stroke animation = dependency-free CSS** (`pathLength=1`
  + staggered `stroke-dashoffset`); GSAP identity is a later session.
- **In-app D-002/D-005 disclosure + attribution** ship in the About panel (required).
Verified end-to-end with Playwright (home → review → 8-stroke kanji animating → summary; IndexedDB
persists across reload; zero page errors). Scope stays L1; full scheduler, multi-level offline, more
retrieval modes, real-world scenes, TTS audio, and export/import UI are the next sessions.
*Source: Session 6 build, 2026-07-12; approved plan + Playwright verification.*

### D-010: Varied retrieval modes — the same item escalates as you learn it
Attacks the brief's #1 constraint (maximum repetition without perceived repetition): the single
Reveal→self-grade interaction is replaced by a retrieval **mode that escalates with mastery**,
keyed to the SRS `stage` on `ItemState`.
- **Bands** (`retrievalModeFor`): recognition (stage 0–1, cued: JP → meaning) → production (2–3,
  harder: meaning → JP) → recall (4+, uncued: the existing reveal cards, kanji shows strokes).
  Sentences have no natural production form, so they use recognition in that band. First session is
  mostly recognition (all new items are stage 0); the escalation is a cross-session story.
- **Multiple choice is objective**: correct → `pass`, wrong → `fail` (recall keeps the 3-way
  Again/Partial/Good). Every option — correct answer *and* distractors — is a **verbatim string
  harvested from other L1 items** (`buildPools` + `buildChoices`): vocab `senses[].gloss[0]` /
  `expression`, kanji `meanings[0]` / `literal`, sentence `en`. Nothing is generated (**D-002**);
  the item's own answers are excluded, with a normalized de-dupe and a thin-pool fallback. Kanji MC
  uses meaning↔literal (never readings, which can be empty). Shuffle uses `Math.random` in the app;
  the pure engine takes an injected rng so tests are deterministic.
- **No scheduler change** — `applyReview` is mode-agnostic. **No schema-breaking change** —
  `RetrievalMode` is a new enum, but `JournalEntry.interaction` stays free-form and is now populated
  with the mode label (was the item kind) plus `latencyMs`. Journal is append-only / never read
  back, so no migration.
- **UI**: one kind-agnostic `ChoiceCard` (pick → see the answer, green correct / red wrong → Next);
  `ReviewSession` dispatches recall to the reveal cards, MC otherwise. Scaffold-grade styling
  (GSAP identity is still a later session).
Verified end-to-end with Playwright: recognition (一, correct advance + wrong-answer feedback),
production (下 seeded stage 2, "Which kanji?"), recall (電 seeded stage 5, 13-stroke animation);
journal entries carry `recognition`/`production`/`recall` + `latencyMs`; zero page errors.
Deferred: typed/kana production input, reading-based MC, TTS listening mode, tightening
`interaction` to the enum with a migration, synonym-aware distractors.
*Source: Session 7 build, 2026-07-12; approved plan + Playwright verification.*

### D-011: Full scheduler — nudge, load shaper, leech (architecture §5)
Completes the deferred §5 scheduler; `applyReview` stays mode-agnostic (D-010).
- **Nudge** (`srs.ts` `nudgeMultiplier`): bounded `[0.8, 1.3]` from the last 4 packed outcome bits
  (`0.8 + passes/4 × 0.5`), applied to the pass/fail interval; partial stays a fixed 1-day hold.
  Bounded by construction — no Anki-style ease runaway. Formula was our judgment (doc fixes only the
  range).
- **Load shaper** (`loadShaper.ts`): `snapToLightestDay` moves a due date to the lightest day within
  ±15% of the ideal gap (ceil/floor bounds so it never exceeds tolerance, keeps time-of-day);
  `shapeDueQueue` caps a session at `DEFAULT_DUE_CEILING=60`, keeping the most fragile (lowest-stage)
  and sliding the rest +1 day; intro cap is the doc default **10** (`DEFAULT_DAILY_NEW`, was 12).
- **Leech** (3 fails / 30 days → `leech:true`): needs timestamps, so a `getJournal()` reader was
  added (the journal is otherwise write-only; `lapses` is untimestamped). `isLeech` reads a trailing
  30-day window; a leech gets **forced retrieval-mode variety** (cycled by `lapses` in
  `retrievalModeFor`) rather than more of the same.
- **Golden test**: a seeded 180-day trajectory (`golden.test.ts`) asserts load ceilings hold, nothing
  starves, learnable items mature, and chronic-fail items become leeches without maturing.
- **Wiring** (`useReview`): the due set is pool-restricted then load-shaped at session build; each
  grade re-flags the leech from journal-backed fail history and snaps its next due (anti-clumping).
Deferred: `provisional` fast-track placement; speed/context retrieval bands; settings-tunable caps.
*Source: Session 8 build, 2026-07-12; architecture §5 + golden/Playwright verification.*

### D-012: Multi-level content (L1–L5) + level selector + offline
Unlocks all 20 packs / 15,082 items (was L1 only).
- **Delivery**: L1 stays bundled via static dynamic imports (precached, offline day-one). L2–L5 are
  served as static JSON by a zero-dep Vite plugin (`contentPacks()` — dev middleware + a `closeBundle`
  copy of `content/packs → dist/packs`, keeping `content/packs` the single source of truth) and
  fetched at runtime via `import.meta.env.BASE_URL`. A **StaleWhileRevalidate** workbox route
  (`hikkoshi-packs`) makes a level offline-capable after its first online visit — avoids the ~6 MB
  precache that bundling every level would cost. `packs.loadLevels(levels)` merges selected levels
  into the existing content shape (`L1Content` → `Content`; `loadL1` is now a thin wrapper).
- **Selection**: levels persist in `localStorage` (`settings.ts`, D-001 — first localStorage use);
  Home shows chips (per-level JLPT label + count). `useReview(levels)` loads them and shows a friendly
  error if an uncached level is opened offline.
- **Continuity**: item ids are unique per level (community list assigns one level each); the load
  shaper is restricted to the active pool so deselected-level states never starve a session.
*Source: Session 8 build, 2026-07-12; approved plan + Playwright (L2 fetch + offline) verification.*

### D-013: Typed production input — type the reading
Adds a harder retrieval rung between MC-production and free recall.
- **Mode**: `typed` added to `RetrievalMode`. Ladder is now per-kind — vocab: recognition (0–1) →
  production (2–3) → **typed reading (4–5)** → recall (6+); kanji skip typed (ambiguous on/kun
  readings) → recall at 4+; sentences stay recognition → recall.
- **Input/grading**: `wanakana` converts romaji → kana live (`toKana` IME mode); grading normalises
  both sides to hiragana (`toHiragana`) so kana or romaji both match the **verified** reading (D-002 —
  we check against dataset readings, nothing generated). A runtime guard downgrades typed → recall for
  non-hiragana (katakana) readings, where romaji long-vowel input is too fiddly. Journal logs `typed`
  + `latencyMs`.
Deferred: typed for kanji readings, sentence cloze, and a "close enough" tolerance.
*Source: Session 8 build, 2026-07-12; approved plan + Playwright (会う → あう) verification.*

### D-014: Audio — tap-to-hear pronunciation (Web Speech API)
Fills the "no audio yet" gap the About panel called out. `src/audio/tts.ts` voices Japanese via the
browser's `speechSynthesis` (a `ja-JP` voice, rate 0.9). **D-002-safe**: it speaks the already
dataset-verified reading / sentence — it generates nothing; no TTS dependency or dataset is added.
- **Graceful degradation is the core rule**: `hasJapaneseVoice()` gates all audio UI, and `speak()`
  is a no-op without a voice. `useAudio()` (a hook) flips `available` true once voices load
  (`voiceschanged`), so the 🔊 button appears only where it will actually work and is simply absent
  otherwise — no broken control on voiceless devices.
- **Surfaces**: `SpeakButton` sits next to the vocab reading, the sentence (its front, for listening
  before revealing the translation), and the typed-answer feedback. Kanji-in-isolation is skipped
  (ambiguous on/kun readings). Manual tap only — no autoplay this pass.
- Verified with Playwright by injecting a fake `ja-JP` voice (button dispatches `{text:'あう',
  lang:'ja-JP'}`) and confirming a voiceless context shows the reading but no button.
**Auto-play (v2)**: revealing a vocab recall card, or checking a typed answer, auto-speaks the
reading (a user gesture, so browser autoplay policy allows it); a 🔊/🔇 toggle in the session bar
(persisted via `settings.getAutoPlay`) opts out. Manual 🔊 buttons still work when auto-play is off.
Playwright-verified: reveal auto-plays, mute suppresses the next auto-play, manual override still fires.
Deferred: kanji reading audio; per-reading playback; sentence-front autoplay (blocked pre-gesture).
*Source: Session 9 build, 2026-07-13; own-preference iteration + Playwright verification.*

### D-015: Register scaffold — deliberate polite → plain → casual → keigo (GENKI/Quartet-modeled)
User directive: the app surfaced too much casual Japanese; introduce formal/informal **register**
deliberately and scaffolded like GENKI/Quartet so a learner transitions seamlessly, and make that
curriculum structuring an explicit **goal** (curriculum §3.6). Root cause was a selection bug, not a
content one — `buildSentenceItems` selected shortest-first-then-cap, and です/ます add mora, so polite
sentences sorted behind casual fragments and fell past the cap (measured L1 ≈ 8.5% polite / 91% casual /
0% keigo). User-chosen profile: **"authentic balance"** — polite-majority *production* from day one,
real casual/keigo *exposure* throughout (two register clocks; reconciled with the receptive M5/M7
modules in §3.6).
- **Register is derived, never generated (D-002-safe).** `pipeline/src/register.ts` `classifyRegister(ja)`
  reads each verbatim Tatoeba sentence's grammatical ending + lexical keigo markers → a `Register`
  (`plain | polite | keigo_respectful | keigo_humble | casual | service_script`). It *classifies* dataset
  text; it never authors or edits it. An honest heuristic like the kanji-coverage leveling (D-008),
  disclosed in-app and per item.
- **`SentenceItem.register` is required**, landed atomically with the re-emit (an interim state where the
  schema requires a field the packs lack would fail `Pack.parse`/validate/app).
- **Selection = register quotas per level** (`REGISTER_TARGETS`, curriculum §3.6 table: L1 55/25/20/0 …
  L5 20/25/30/25 polite/plain/casual/keigo). The selector fills each level's buckets best-complete-
  sentence-first (a quality sort that also drains the ！/？ micro-fragment skew), then backfills to the
  cap from non-zero-target registers only (keigo stays 0% at L1). Targets are aspirational; Tatoeba
  availability constrains and **shortfalls are logged, never silently capped** (§1 honesty rule).
- **Targeted sentence-only re-emit** (no vocab/kanji/stroke churn): `pipeline:build-sentences` re-fetches
  only Tatoeba, reuses the committed kanji packs for the known-kanji sets, re-emits `l*/sentence.json`
  + the sentence rows of `manifest.json`; `lock.generatedAt` and all other packs stay byte-identical.
  `emit.ts` factors out a reusable `emitSentencePacks()` so re-emitted bytes match a full build.
- **Register is visible**: `SentenceCard` shows a small tinted register chip (polite/casual/keigo/plain);
  About + curriculum §3.6 disclose the scaffold and the heuristic.
Result [counted this build]: L1 55% polite / 20% casual (was ~8.5% / ~91%); genuine 尊敬語/謙譲語 from L2,
25% keigo by L4–L5; validate green (20 packs / 15,082 items, sha256-matched, vocab/kanji/strokes
unchanged). GENKI sequence verified against the St. Olaf Genki I & II grammar index (です L1 → ます L3 →
て-form L6 → short/plain L8 → 尊敬語 L19 → 謙譲語 L20); Quartet ≈ N3→N2.
Deferred: the "conjugate into register" production retrieval mode (E2 keigo/casual transforms); per-sense
vocab register; grammar-point register curation (D-005). Tatoeba lock date kept stable to scope the diff.
*Source: Session 10 build, 2026-07-13; approved plan + re-emit/validate verification.*

### D-016: Grammar points as a first-class content type (curated-cited, N5→N1)
Builds the third leg of JLPT study (curriculum §3.3) — the grammar inventory D-005 committed to. The
`GrammarPoint` schema + `PackDomain: 'grammar'` already existed unpopulated; this session populates and
wires them across all five levels. User directive: cover N4–N1, not just N5.
- **Grammar prose is authored; grammar examples are dataset-verified.** This is the one content type
  where model-written prose is allowed (D-005 exception — no importable open grammar inventory exists):
  each point's `name` (pattern), short `gloss`, and fuller `summary` are original descriptions. But
  **example sentences must never be generated (D-002)** — so `pipeline/src/grammar.ts` `linkExamples()`
  draws them verbatim from the Tatoeba corpus by matching each point's literal `patterns`, keeping only
  sentences readable at the point's level (kanji-coverage ≤ level), embedding the best few with author
  attribution. A point that matches **zero** examples is logged and **held back** — nothing ships
  example-less. (All 98 authored points found ≥1 example, incl. N1.)
- **Grammar is `curated-cited`, not `dataset-verified`.** `VerificationStatus` already had the value;
  `buildPack` now takes status per domain and `validate.ts` expects `curated-cited` for grammar. The
  D-002 provenance gate still holds — `Pack.parse` requires ≥1 `citations` per point + pack `sources`
  (Tatoeba, credited for the examples). Point placement is cross-referenced against ≥2 public inventories
  (JLPT Sensei per-level + Bunpro); N5/N4 carry **verified** Genki I/II chapter anchors (St. Olaf grammar
  index), N3–N1 omit textbook anchors rather than fabricate Quartet/Tobira chapters (honesty rule).
- **Two prose fields**: a short `gloss` (MC option + compact display) and a fuller `summary` (recall card).
- **Retrieval mirrors sentences** (no production/typed form): recognition (pattern + example → pick the
  gloss; distractors = other glosses) → recall (reveal summary + examples + citations). `GrammarCard` +
  the interleaved intro round-robin; the SRS/store are kind-agnostic (no changes).
- **Scale, honestly disclosed.** This phase authors a genuinely-cited core at each level (L1 25 · L2 24 ·
  L3 19 · L4 16 · L5 14 = 98 shipped); the JLPT-Sensei-scale totals (§3.3: 848) are the aspiration, the
  gate ships only cited+exampled points, and the achieved count is disclosed — no fabricated coverage.
Result: validate green (25 packs / 15,180 items; grammar `curated-cited`, sha256-matched; vocab/kanji/
sentence/stroke packs byte-identical). `pipeline:build-grammar` re-emits grammar independently; a full
`pipeline:build` also links + emits it (no silent drop). Deferred: N4–N1 completion toward the full
inventory; the E2 register-transform production mode (needs `TransformRule`, undefined); grammar as a
scene-beat interaction; grammar↔vocab/kanji linking.
*Source: Session 11 build, 2026-07-13; approved plan + build-grammar/validate + Playwright verification.*

### D-017: The scene engine — first real-world errand (konbini), designed not grey-boxed
Roadmap Phase 1 (see the approved roadmap): the game layer (D-006 Concept A · Hikkoshi) had zero code —
`SceneTemplate`/`Beat` existed only on paper (architecture.md §4), `ModuleTag`/`PhraseTemplate` were
schema stubs populated by nothing. This session builds the spine end-to-end: schema → curated content →
pipeline emit → `SceneRunner` → UI, and — on explicit user direction ("ensure use of any available
skills for graphic design and UI/UX… do NOT make this a generic AI tool") — ships with real design craft
on the scene surface rather than the scaffold styling the rest of the app still carries. This pulls a
slice of Phase 3 (D-003 visual identity) forward for this one surface; the full app-wide token/motion
system remains a later session.
- **Schema**: `Beat` (`interaction: recognize|recall|produce|speed|context`, `slotIds` — logical labels,
  not item ids) + `SceneTemplate` (`beats` + `framing`, each framing entry optionally naming a `beatId`
  and a cited `phraseId`) added to the `Item` union; `PhraseTemplate` gained the `level` field emission
  needs. Beat.interaction is deliberately its own vocabulary, distinct from the flashcard `RetrievalMode`
  — a future produce/speed/context beat (Phase 4) isn't a flashcard mode retrofitted onto a scene.
- **D-002 held exactly like grammar/D-016**: a scene's item slots are **resolved at runtime** from
  dataset-verified vocabulary (never authored); the clerk's lines are cited `PhraseTemplate`s copied
  verbatim from the same M2 sources curriculum.md §4 already vetted (Coto Academy, LIVE JAPAN, Go! Go!
  Nihon, and the Bunkachō FY2013 baito-keigo survey — the exact disputed lines「お会計の方、1万円になります」
  /「千円からお預かりします」); only the English framing narration is model-written. `phrase`/`scene` are
  `curated-cited` domains (the per-domain status mechanism from D-016), with a pack-level `sources`
  pointer to "see per-item citations" (`emit.ts` `curatedOnly` — no `sources.lock.json` entry exists for
  hand-cited web guides, so borrowing the dataset-lock mechanism would misrepresent provenance).
  `validateSceneReferences` rejects any scene whose framing names a phrase id that doesn't resolve —
  no dangling reference ships.
- **`ModuleTag` activated.** Defined in the schema since Session 4, populated by nothing until now:
  `pipeline/src/moduleTags.ts` applies a curated expression+reading → tag list
  (`content/curated/modules/m2_konbini.json`, 32 real L1–L3 vocab items — 店/買う/食べ物/お金/暖かい/…
  at L1 up through 弁当/袋/カード/会計/暖める at L3) against the **already-committed** vocab packs and
  re-emits only the levels that changed (`pipeline:build-modules`; verified L1–L3 vocab.json changed,
  L4–L5 byte-identical). This means the same konbini errand naturally deepens as a learner's active
  levels expand — L1-only sees everyday words; unlocking L3 adds the specific checkout nouns.
- **`SceneRunner`** (`src/scenes/sceneRunner.ts`, pure + unit-tested; `src/scenes/useScene.ts`, the hook):
  `buildSceneSteps` flattens a scene's `framing` into an ordered walk (narration steps vs. beat steps);
  `pickSlotItem` resolves each beat's item from the scene's module pool — **due item first (earliest
  due), else a known item, else a fresh introduction** (curriculum §5 P1/P3: the SRS decides *what*, the
  scene decides *where*), never repeating an item within a run. Grading reuses the **exact same path** as
  the flashcard review — `buildChoices`/`applyReview`/`putItemState`/`appendJournal` — now writing
  `sceneId` (the schema field existed since the progress schemas landed, never written until today).
  `recognize`→`recognition` mode, `recall`→`production` mode (the closest existing harder direction;
  a dedicated typed/produce beat is Phase 4).
- **Designed, not grey-box**: a hand-authored flat-vector SVG konbini counter (wood counter, receding
  shelf rows, a noren banner, an abstract geometric clerk — deliberately not a face render), a
  visual-novel-style dialogue box (nameplate + cited JP line), and a receipt-styled scene-complete recap
  (monospace, dashed rules, OK/MISS) — reusing `ChoiceCard` unmodified via CSS scoped under `.scene-view`.
  Extended the palette with two purposeful tokens (`--accent-2` noren indigo, `--paper`/`--wood` warm
  tones), informed by real research (shironeri washi-paper white, aizome indigo, cozy-game tactile UI)
  rather than a generic default. `App.tsx` gains a third `'scene'` view; Home gets an "Errands" CTA.
Verified end-to-end (Playwright, real IndexedDB): a fresh L1 run surfaced 暖かい/熱い/売る/円 (real,
un-repeated, module-tagged items) across recognize/recall beats with cited clerk dialogue; graded both
pass and fail; 4 real journal entries landed with `sceneId:'scene:l1:konbini'`; the flashcard review
still worked unchanged afterward; zero page errors. `pipeline:validate` green (27 packs / 15,189 items).
Deferred (Phase 2+): the day loop/life-stage frame that makes errands the primary entry point; produce/
speed/context beats; more scene kinds (transit, cityhall); the full app-wide visual/motion system.
*Source: Session 12 build, 2026-07-13; roadmap Phase 1 + Playwright verification.*

### D-018: The day loop — Today panel, life-stage frame, module unlock, Diary
Roadmap Phase 2 (see the approved roadmap; named in architecture.md §9 build-order item 6 and deferred
by D-017's closing line): Phase 1 shipped one real errand, hardcoded as `App.tsx`'s only route into it.
This session turns that single errand into a reason to come back tomorrow — a "Today" plan (review +
errand tasks), a life-stage narrative over real coverage, and a capped end-of-day Diary reading pass.
`DayPlan`/`LifeStage`/`DiaryEntry` are ephemeral — always recomputed from already-validated `ItemState`/
`JournalEntry`/`Content`, never persisted or exported — so, per this codebase's Zod-for-trust-boundaries
convention, they're plain TypeScript types in the new `src/day/`, not schema or pipeline changes.
- **`DayPlan` is an honest task list, never padded.** `buildDayPlan` reports `dueCount`/`introCount` on
  the review task verbatim (real numbers, e.g. `pickNewItems(...).length` — never the raw budget, which
  could overstate availability once a pool is exhausted) and adds one errand task per unlocked scene
  candidate; with one scene shipped, a day has ≤2 tasks — real, not a fabricated "2–4." A day with
  nothing due, introducible, or unlocked yet renders an honest empty list, not invented busywork.
- **`LifeStage` is six named stages over contiguous cleared-level coverage.** `computeLifeStage`'s stage
  is the length of the *contiguous* cleared-level prefix (L1→L5) — a gap caps progress rather than being
  skipped over. "Cleared" = **70%** of a level's reviewable pool (vocab+kanji+grammar+sentence; mind
  `SentenceItem.levelEstimate` vs. every other domain's `.level` — `appMeta.ts`'s `reviewablePoolIds`
  centralizes this so the gotcha can't silently recur) carries an `ItemState`. 70% is a documented,
  adjustable judgment call — curriculum.md §5 P5 specifies no number. Names are the canonical wording
  from design-options.md:64: Tourist → Resident → Part-timer → Employee → Senior staff → "You handle it
  for someone else." An empty/unloaded pool is "not cleared," never a vacuous 100%.
- **Module/scene unlock is a real coverage mechanism, `M2_konbini` pinned open.**
  `MODULE_UNLOCK_THRESHOLD` (absent = 0 = always unlocked) gates whether a scene appears as a candidate,
  not whether its vocabulary is reviewable — a module's tagged vocab is always in the ordinary level
  review pool, so `moduleCoverage` rises through normal study regardless of whether the module's own
  scene is locked. Konbini is curriculum's own "entry N5" module and the only one with tagged vocab
  today, so gating it now would regress Phase 1's always-available errand for zero benefit. Multi-module
  scenes gate conjunctively — `isSceneUnlocked` requires every tagged module to individually clear.
- **Scene staleness is a sort preference, never a filter.** `deriveSceneHistory` reads each scene's
  last-shown day straight from the journal's existing `sceneId` field (Phase 1, D-017) — no new
  persisted storage. `buildDayPlan` sorts unlocked candidates stalest-first (never-shown ahead of any
  shown scene) but never drops one: a stale-but-only candidate still surfaces, the same regression class
  the module-unlock guarantee already protects against, applied consistently.
- **Diary is a genuine, capped reading pass, deliberately grey-box.** `pickDiaryEntries` takes today's
  distinct reviewed vocab ids (deduped across scene and flashcard review alike; defensively re-sorted
  rather than trusting the journal store's iteration order) and, for each, finds the first already-loaded
  sentence whose `.ja` contains that vocab's `.expression` — the exact substring technique
  `pipeline/src/grammar.ts`'s `linkExamples` already uses server-side, now client-side. An item with no
  matching sentence is skipped — never fabricated — and skipping it doesn't consume the 5-entry cap.
  Tapping a word reveals its gloss and logs one `{interaction:'context', outcome:'pass'}` journal entry
  (recognition credit, reusing the already-defined `'context'` value); a repeat tap is a no-op, not a
  second entry. The illustrated pass over this surface is Phase 3 (D-003) — this phase reuses
  `.card`/`.start-btn`/`.ghost-btn` rather than inventing new visual language early.
- **Home becomes self-fetching, and a light Onboarding gates it once.** `useToday(levels)` mirrors
  `useScene`'s loading pattern — loads content/states/journal once, derives everything — but **never
  calls `putItemState`**: its due/intro counts are a strictly read-only preview of `useReview`'s own
  shaping (same `dueItems`+`shapeDueQueue`, `pickNewItems`+`introBudget` primitives), not a session; the
  real session's persistence still only happens when `useReview` actually runs. The two old static CTAs
  are replaced by one Today panel; the level-picker keeps its own section rather than being dropped.
  `onStartScene` now takes a `sceneId` so `DayTask.errand.sceneId` means something, instead of routing to
  one hardcoded errand. A new, deliberately narrow `Onboarding` screen (a `settings.ts` `onboarded` flag,
  following `getAutoPlay`'s exact boolean shape) introduces the app once before Home ever renders — no
  level-picking or placement logic there; that's build-order item 7, later and separate.
- **`fake-indexeddb` lands as test infrastructure.** jsdom ships no IndexedDB implementation, and this
  repo had zero test coverage of any store-touching code before this session (`ReviewSession`/`SceneView`/
  `useReview`/`useScene` were verified only via Playwright). `useToday` is the first hook with direct
  vitest coverage, including the critical guarantee that merely loading it never writes a row.
Verified: 34 new unit tests across `src/day/` (life-stage boundaries, module-unlock thresholds, day-plan
honesty/cap/staleness-sort, diary matching/dedup/cap) plus hook-level `useToday` tests (fresh-store shape,
seeded-coverage stage transition, idempotent reveal, no-writes-on-load) and updated `App.test.tsx`
(onboarding gate, life-stage label) — 163 tests total, green; typecheck/lint/build clean. Playwright,
live: onboarding → Continue → Home's Today panel shows "Tourist" + real due/intro counts + the konbini
errand, unlocked from zero; a review session completes normally; the errand still works and logs
`sceneId`; once due and intro both hit zero the panel honestly shows no review task rather than a fake
one; after an errand pass, a Diary row appeared (円/えん matched into a loaded sentence), tap revealed the
gloss and English, and a repeat tap did not duplicate it; zero page errors throughout.
Deferred (Phase 3+): the placement probe (build-order item 7); more scene kinds, so the day-plan cap and
scene-history sort actually bind against real competition (Phase 5); the illustrated visual pass over
Today/Diary (Phase 3); `ProgressExport` still lacks `lifeStage`/`settingsHash` (not touched — these are
ephemeral/recomputed, not exported state).
*Source: Session 13 build, 2026-07-13; approved plan + Playwright verification.*

### D-019: Visual identity + motion (D-003 fulfilled) — the whole app becomes one considered system
Roadmap Phase 3 (architecture.md §9 build-order item 8), the dedicated GSAP session D-003 promised at
Session 1. Before this session: one beautifully designed screen (D-017's konbini) next to an otherwise
scaffold-grade app, and zero motion anywhere except two small CSS keyframes. User direction: **"ensure
visual continuity"** (the whole app reads as one system, not one nice screen + defaults) and **"innovate
on smoothness and navigation"** (real motion design, not decoration).
- **Two new fonts, self-hosted, one placement rule each.** `Zen Old Mincho` for headings and narrative/
  reading Japanese specifically (Diary's `.diary-ja`, the life-stage badge) — one statable rule:
  *narrative JP gets the serif; drill-prompt JP (`cards.tsx`'s `.jp-xl`/`.jp-lg`, the highest-frequency
  text in the app) stays gothic*, since a beginner's at-a-glance legibility there outweighs variety.
  `Klee One` is reserved for exactly one moment — the life-stage-up celebration framing — never reused,
  so it stays a felt "something good happened" cue instead of becoming just another font.
- **GSAP scope: `gsap` core + `Flip` only**, imported from `gsap/Flip` (never `gsap/all`). No
  ScrollTrigger — nothing in this app scrolls in a way that needs it. `Flip`'s type import must be a bare
  `import 'gsap/Flip'` side-effect import, not `import type { Flip }` — the latter binds to a
  non-namespaced re-exported class that doesn't resolve `Flip.FlipState` and reads as unused under this
  repo's `verbatimModuleSyntax`/`noUnusedLocals`.
- **`src/motion/` is pure modules + thin hooks**, matching `src/day/`'s shape: `tokens.ts` (duration/ease
  constants), `reducedMotion.ts` (`gsap.matchMedia()` + `isReducedMotion()`), `timelines.ts` (enter/exit/
  stagger/pulse-pass/shake-fail/celebrate factories, all reduced-motion-aware), `flipHandoff.ts` (a plain
  module-singleton `stash`/`take` pair — this codebase has zero `React.createContext` usage anywhere, so
  a plain singleton matches existing convention better than introducing Context). jsdom here ships neither
  `window.matchMedia` nor `requestAnimationFrame`; both are polyfilled in `src/test/setup.ts`
  (`matchMedia` defaults `matches: true` — reduced motion **on** in tests — which collapses GSAP tweens
  near-instant for a suite that mounts/unmounts fast, and incidentally gives the reduced-motion path
  coverage it would otherwise never get).
- **Flip (shared-element) transitions only for Home→Review and Home→Scene** — the two highest-traffic
  navigations: the tapped task's rect morphs into the destination header band. The **return** trip is a
  plain fade, not Flip, and not just for cost reasons — Home's task list re-renders fresh on return, and
  the tapped task may no longer exist (the review task vanishes once due+intro both hit zero right after
  finishing it), so there's often no valid element to morph back into. The generic view-fade
  (`useViewTransition`) and the Flip morph (`useFlipLanding`) are independently composed — the fade owns
  only the container crossfade; Flip is a separate, opt-in layer destination components add via their own
  mount, checking the stash/take handoff. `useFlipLanding`/`useEnterAnimation`-consuming components must
  call these hooks before any early return (`react-hooks/rules-of-hooks`) — caught twice
  (`ReviewSession.tsx`, `SceneView.tsx`) by the lint gate.
- **pulse-pass/shake-fail are wired to the still-mounted moment, never the final grade-and-advance
  click.** `useReview`'s `grade()` unmounts the card immediately, so a tween started on "Next →" would
  race the unmount and never visibly paint. `ChoiceCard`'s option click and `TypedCard`'s `check()` stay
  mounted after firing — that's where the tween goes, additive alongside the existing synchronous state
  calls, so `cards.test.tsx`/`ui.test.tsx` needed zero changes.
- **Reduced motion splits by what the animation actually is, not one blanket rule.** `study.css`'s
  `.stroke-path` KanjiVG stroke-draw keyframe has no GSAP equivalent in scope (DrawSVG territory,
  excluded) and was left exactly as pure CSS. `scene.css`'s `scene-rise`/`scene-choice-in` keyframes
  duplicated concepts the new `timelines.ts` already defines for reuse everywhere, so they were migrated
  into the shared primitives and deleted — closing a real "two parallel reduced-motion systems for the
  same idea" gap.
- **Wagara motifs get one deliberate placement each, not blanket decoration**: asanoha (growth) on
  Onboarding's card only; seigaiha (waves) behind the Diary card only; kumiko (lattice) as the general
  divider/border, a direct extension of the existing `--wood`/`--wood-dark` tokens; ichimatsu
  (checkerboard) reserved for the life-stage celebration only. All four are CSS gradients, not SVG assets.
  Three are low-opacity `color-mix` washes (asanoha/seigaiha at 8%, discovered by direct visual check that
  an initial 30%-opacity/small-tile pass read as a busy grid competing with text). **Ichimatsu shipped
  first as a *solid*-color conic-gradient** — the same `--accent-2` as the badge text sitting on top of
  it — which silently erased the celebration text wherever a glyph crossed a solid square (confirmed by
  live-browser screenshot: the word inside the badge was simply invisible). Fixed in the same commit that
  discovered it, to the same 20%-`color-mix` treatment (bolder than the other three's 8%, since this one
  moment is meant to read as a stamp, but still a wash, never solid fill, over same-color text).
- **CJK webfont precache footprint measured, not assumed.** `@fontsource`'s Japanese packages ship many
  unicode-range-chunked woff2 files (a browser normally lazy-fetches only what a page renders), but
  `vite-plugin-pwa`'s blanket `globPatterns` would precache all of them at install time regardless.
  Measured directly against the built `dist/sw.js`: excluded both font packages from `globPatterns` and
  added a dedicated `CacheFirst` `runtimeCaching` route (`hikkoshi-fonts`, 1-year expiry) instead —
  mirroring the exact `StaleWhileRevalidate` pattern already used for L2–L5 content packs (same accepted
  "offline after first online visit" trade-off, not a new one). Verified zero `.woff2` entries land in the
  generated precache manifest.
- **Life-stage-up celebration, with a fixed sentinel bug.** A naive "celebrate whenever
  `stage > lastCelebrated`" with a `-1` default would fire on a brand-new profile's very first load
  (`0 > -1`) — celebrating merely *arriving* at the default starting stage (Tourist) as an achievement.
  `decideCelebration` uses `null` (never a numeric sentinel) for "never celebrated": the first-ever read
  silently establishes the baseline with no celebration; only a **later** load computing a stage greater
  than the persisted baseline celebrates. Copy is 5 hand-written framing strings, not one template, since
  stage 5's name is already a full sentence ("You handle it for someone else.") and breaks any uniform
  "Your residence card now reads: {name}" pattern. Presentation is inline on the badge (an elastic
  `celebrate()` stamp + fading framing text, ~4s), never a blocking modal.
- **`decideCelebration`'s read-decide-persist step needed no extra guard against React Strict Mode's
  dev-only double-invoke of `useToday`'s effect** — a plausible-sounding concern raised while first
  live-verifying this commit, but disproven by tracing the actual execution: the pre-existing `alive`
  cancellation-guard flips false (via the effect's cleanup) before the first invocation's suspended
  `await` can resume, so invocation 1 always bails before ever reaching the celebration code; only
  invocation 2 ever runs it, exactly once. The apparent failure to celebrate during live verification
  traced instead to the **verification script**: Playwright's `text=` selector is case-insensitive by
  default, and Onboarding's own copy sentence contains the lowercase word "tourist"
  ("...life stage: tourist, resident, and further in."), so a `waitForSelector('text=Tourist')` matched
  that copy and declared victory before Home ever mounted for real — masking that the baseline had never
  actually been established. Corrected verification (waiting for the real `.life-stage-badge` element)
  confirmed the original, unguarded implementation was already correct.
- **App icon/favicon untouched** — already a clean, appropriate torii+hinomaru mark.
Verified per commit (typecheck/lint/`vitest run`/`pipeline:validate`/build) plus live-browser passes: every
screen in both color schemes, both transition types at natural pacing, reduced-motion emulation toggled on
every path, CPU-throttled Flip transitions, and the life-stage celebration seeded via real IndexedDB
coverage (fresh profile silently baselines at Tourist with no framing text; seeding past L1's clear
threshold reaches Resident with the stamp + legible framing text in both light and dark schemes; the
framing fades after ~4s while the stamp persists for the rest of that session; a later revisit at the same
stage re-shows neither) — zero console errors throughout.
Deferred, not forgotten: kisetsu seasonal color rotation; extending the narrative serif to study-card
drill text; a Flip-based transition for the return trip home.
*Source: Session 14 build, 2026-07-14; approved plan + Playwright verification.*

### D-020: Production + escalation beats — the upper three rungs of the retrieval ladder
Roadmap Phase 4 (architecture.md §9 build-order item… the scene-interaction escalation the design has
carried since Session 3). The `Beat.interaction` schema enum has defined five values since D-017
(`recognize`, `recall`, `produce`, `speed`, `context`), but the scene engine implemented only the first
two — everything non-`recognize` collapsed to a production MC. This phase implements the three harder
stages of design-options §E2's ladder (recognition → recall → **production → speed → context**) and
re-authors the one shipped konbini errand into an escalating five-beat arc so E4's "same items, rising
stakes" is demonstrable inside existing content. Higher-level scene variants, more scene kinds, and the
placement probe (E5) stay Phase 5.
- **produce = typed production of the resolved item's reading**, reusing the wanakana pipeline
  (`TypedCard`), cued only by the English gloss, graded through the normal SRS path. Reuses D-013's
  `isHiragana` guard: a katakana-reading item (カード) downgrades to a production MC, since romaji
  long-vowel input is too fiddly — the exact rule the flashcard `typed` mode already applies. This is
  the customer-side production the design's E4 trace puts at L3.
- **speed = timed recognition** (JP → meaning under a countdown — the "checkout barrage"). The timeout
  auto-grades `fail` and advances; SRS applies normally. The clock runs on plain JS timers, never GSAP,
  so the reduced-motion duration system (D-019) can't collapse it to instant — the countdown is
  functional, not decoration. The draining bar is pure CSS and disables under `prefers-reduced-motion`
  while the numeric second-count keeps the beat fully playable (E8 text-first). `ChoiceCard` gained an
  optional `onPick` (a no-op for the flashcard review) so the timer stops the moment an option is chosen.
- **context = register/function discrimination over the scene's real cited service phrases.** An English
  situation is described, the clerk's line withheld, and the learner picks the fitting cited line from
  real phrase options (`buildPhraseChoices` — correct line + verbatim distractors from the module's other
  phrases). **Chosen over "meaning-in-context via a containing sentence"** because the narrow M2 vocab
  barely appears in the L1 sentence pool (袋/温/店 = 0 containing sentences each — measured, not assumed),
  so that design would perpetually fall back to bare recognition; whereas the 8 cited M2 phrases guarantee
  content and this uniquely drills the phrase/register system nothing else exercises. D-002-safe (every
  option is a verbatim cited `PhraseTemplate.pattern`); it realizes "notice appropriate usage in scene."
  A context beat operates on a *phrase*, not a vocab item, so it logs a `context` journal entry against
  the phrase id **without a `putItemState`** — phrases were never SRS-scheduled, mirroring how the Diary
  logs a context read without touching item state. `SceneSummaryEntry` widened to carry a vocab item OR a
  phrase line, and the receipt renders whichever it has.
- **The five beats stay author-driven, not stage-driven.** The flashcard side escalates retrieval by the
  *item's* SRS stage (`retrievalModeFor`); scenes escalate by *authored beat* (architecture §4), with
  level as the E4 escalation axis. Keeping these separate — rather than making a beat auto-escalate to a
  harder rung when the resolved item happens to be mature — preserves the clean "SRS decides *what*, the
  scene decides *where* and *how hard*" split and avoids a stage→interaction coupling the one shipped L1
  scene can't yet justify.
- **Honest deferral:** full staff-side keigo *production* and error-noticing / baito-keigo "spot the wrong
  keigo" (the E4 L4–L5 beats) need the disputed-forms bank (Bunkachō survey items + rule-inverted
  transforms) and higher-level scene variants — Phase 5 content, disclosed in the About panel ("producing
  full keigo from behind the counter — and catching a coworker's register slips — arrives with the higher
  levels") rather than faked now.
Verified: pure resolvers (`planBeat`, `buildPhraseChoices`) and the speed countdown are unit-tested (+10
tests, 194 total); `pipeline:validate` green (27 packs / 15,189 items, sha256-matched, phrase pack
byte-identical). Live-browser, both color schemes + reduced-motion: the konbini errand walks
recognize → recall → produce → speed → context in order; the produce typed answer grades; the speed
countdown both beats-the-clock (picking stops it) and auto-fails on timeout (advancing to the next beat);
the context beat discriminates the farewell line among real service lines; the receipt mixes drilled words
with the context line — zero console errors.
*Source: Session 15 build, 2026-07-14; approved plan + Playwright verification.*

### D-021: Placement probe (E5) — a calibrated entry point across the existing multi-level content
Roadmap build-order item 7 (`architecture.md §9`), explicitly deferred by `Onboarding.tsx`'s own comment
until now. Completes the core engine's last unbuilt piece (E1 SRS ✓, E2 retrieval ladder ✓, E3
interleaving ✓, E4 escalation ✓, **E5 placement ← this**, E8 honest limits ✓). Before this, every learner
started at zero and ground up from L1; a mid-level entrant (finished Quartet I ≈ N3, say) had no way in.
The user chose this over authoring a new scene kind — the art-heavy "modules" M3–M10 expansion stays a
follow-on. Placement is a *scale* feature in its own right: it scales the learner's entry point across the
15,189 items that already ship, rather than adding content.
- **Honest scope, stated in-app (E5's own requirement):** the probe is **IRT-*informed*, not a validated
  IRT instrument** — a difficulty-ordered adaptive staircase, disclosed as a quick estimate the app
  refines through review, never as exam-grade placement (no validation data exists pre-launch).
- **Adaptive staircase** (`src/placement/probe.ts`), 8 questions, starting mid-range at L2: a correct
  answer steps the difficulty band up, a wrong one steps it down (clamped L1…L5). The estimate is the
  **highest band ever answered correctly**, or **L0** (seed nothing, start at the beginning) if even L1
  is missed. Deterministic given the item stream, so it unit-tests cleanly.
- **Difficulty ordering** (`difficulty.ts`): recognition items per band, kanji before vocab, kanji ranked
  by KANJIDIC2 `grade` then `freq` (both already on every kanji item) — the "kanji recognition → vocab →
  grammar" ordering E5 specifies, trimmed to what an 8-item staircase can fairly sample (grammar/sentences
  don't fit a quick recognition MC, so they're left to normal review). Choices reuse `buildChoices`
  (D-002-safe — every option is verbatim dataset content).
- **Seeding** (`seed.ts`): every reviewable item up to the placed level becomes a *provisionally known*
  `ItemState` — the `provisional` flag that had existed unused since Session 6 — at stage 2, due spread
  across 10 days so the confirm pass doesn't flood (the load-shaper's 60/session cap paces the rest). This
  makes life-stage, the due queue, and module coverage reflect the placement at once. Bulk-written in one
  IndexedDB transaction (`putItemStates`; ~15k rows for a top placement, ~1.5s, behind a "Settling you in…"
  state).
- **Provisional confirm/drop** (`srs.ts` `applyReview`, the "provisional fast-track" D-011 deferred): a
  seeded item's first review is a confirmation test — pass/partial confirms it (clears the flag, advances
  normally), fail disconfirms it (clears the flag, restarts as genuinely new: stage 0, due now, no lapse —
  a bad placement guess isn't a real forgetting). Overshoot from a lucky probe answer therefore
  self-corrects at review time; the honesty lives in that mechanic + the disclosure, not in false probe
  precision.
- **Level activation:** a placement of level N also sets the active-level set to L1…N (`levelsUpTo`), so
  the seeded higher-level states actually enter review and life-stage rather than sitting inert behind the
  L1-only default. The level picker still lets the learner adjust afterward.
- **Onboarding fork, one-time via the existing `onboarded` gate** (no new flag needed): "I'm new — start
  at the beginning" (→ L0, unchanged behaviour) or "I've studied before" → the probe. Skippable at any
  point. If L2–L5 can't load (offline first run — higher levels are runtime-cached, not precached, per
  D-012), the probe degrades to a "start at the beginning" card rather than trapping the learner.
- **No celebration on placement** (correct by construction): `decideCelebration` treats the first-ever
  life-stage read as baseline-establishing, so being *placed* at stage 5 sets the baseline silently —
  celebration is reserved for a stage *earned* through play (D-019), not a starting point.
Verified: pure staircase/difficulty/seed logic + provisional SRS handling are unit-tested (+17 tests, 211
total); typecheck/lint/build clean; `pipeline:validate` a no-op pass-through (no content/schema-emit change
— the `provisional` field already existed). Live-browser, both color schemes + reduced-motion: beginner →
Tourist, L1 only, nothing seeded; all-correct → placed to life-stage 5 with all levels active and a full
(load-shaper-capped 60) due queue; all-wrong → L0, stays Tourist; a provisional item failed on its first
review drops back to genuine learning — zero console errors throughout.
Deferred, not forgotten: new scene kinds / modules M3–M10 (transit, city hall, …) and their art + cited
phrases; the E4 L4–L5 staff-side keigo / error-noticing beats (Phase 4 deferral); E6 textbook-mode chapter
seeding; E7 progress export/import UI; making the probe a validated IRT instrument.
*Source: Session 16 build, 2026-07-15; approved plan (user picked placement over a new scene) + Playwright verification.*

### D-022: Progress export/import — the brief's E7 portability, no backend
The brief requires progress to be "a single exportable JSON (SRS states, scene history, settings hash) via
file download/upload — no backend," and the `ProgressExport` schema (`{schemaVersion, exportedAt,
itemStates, journalTail}`) has existed unused since Session 6. This lands it as a small, self-contained
utility — chosen as a quick, low-risk win after Phase 5 (user: "as much as possible before the reset …
quick and easy … no errors").
- **Export** (`buildProgressExport`): every item state plus a bounded journal tail (`JOURNAL_TAIL_MAX =
  2000`, comfortably covering the 30-day leech window while keeping a heavy user's file bounded). Pure —
  `exportedAt` is injected, not read — and downloaded client-side (Blob + anchor, date-stamped filename).
  Nothing is uploaded (D-001).
- **Import** (`parseProgressExport` = `ProgressExport.parse`): Zod validation is the **trust boundary** —
  a malformed file (wrong shape, out-of-range stage, junk types) throws before any write, so a bad import
  corrupts nothing and the UI shows a clean error. On success it **merges**: `putItemStates` overwrites by
  id, `appendJournalEntries` appends. Merge (not replace) is deliberate — restoring is never destructive
  to progress the backup doesn't mention, and there's no way to lose data to a partial file.
- **Honest scope:** the snapshot carries *learning* progress (item states + a journal tail), not settings —
  active levels, the onboarded flag, and autoplay live in localStorage and aren't in `ProgressExport`. So a
  cross-device restore brings your SRS state and life-stage, but the level picker is one tap to re-set
  (the imported higher-level states only surface once those levels are active). Re-importing your own
  backup appends its journal tail again; harmless (only leech detection reads the journal, and it windows
  to 30 days), but noted. A settings-inclusive snapshot, a journal de-dup on import, and an explicit
  "replace everything" mode are deferred.
- **Placement:** a `ProgressTransfer` block at the foot of the existing About panel — the app's "meta"
  home — so Home's card layout is untouched; import offers "Reload to apply" (the read-once hooks pick up
  restored state on reload) rather than a live in-place refresh.
Verified: pure round-trip / tail-bound / invalid-rejection unit tests (+6, 217 total); typecheck/lint/build
clean. Live-browser: a placed profile (12,969 states, life-stage 5) exported to a date-stamped file, wiped
to Tourist/0, then restored to 12,969 states and life-stage 5 (round-trip exact); an invalid file shows a
clean error and writes nothing (states unchanged); zero console errors.
*Source: Session 16 build, 2026-07-15; user-requested quick win + Playwright round-trip verification.*

### D-023: L0 kana foundation — the missing beginning, dataset-verified
The Immersion Pass, slice 1 (user directive: one expert session to "encapsulate language-learning from
beginning to end," full creative authority; confirmed scope "full journey, ordered"). The `L0` level had
existed in the schema since Session 4, populated by nothing — the app silently assumed every learner
could already read kana. Now the beginning exists, without bending D-002:
- **Content is dataset-verified + curated-cited.** The 142 single-glyph kana (46 base + 25 voiced per
  script) get their characters and stroke data from **KanjiVG** — already licensed, already in
  sources.lock, fetched per character from the same pinned tag/cache as kanji (all 142 resolved; a
  partial syllabary fails the build loudly). Romaji follows the **Hepburn** convention with per-item
  acceptance alternates (shi/si, chi/ti, tsu/tu, fu/hu, ji/zi, ji/di, zu/du, wo/o, n/nn) so typed
  grading can never fail a correct learner on a spelling variant. The kana pack attests
  `curated-cited`; its L0 strokes sibling attests `dataset-verified`. Yōon combos (きゃ…) and small
  variants are deferred — two-glyph / no standalone romaji — and disclosed in About.
- **The pack order IS the curriculum.** Kana emit in gojūon row order, hiragana fully then katakana,
  and `buildPool` places all kana ahead of the kind round-robin — so the intro budget introduces them
  **blocked, row by row** (E3's "block what's new," and the sequencing kana-pedagogy references
  recommend; researched: Tofugu's chart guidance, gojūon practice-sequence articles). A beginner's
  first-ever card is あ; the second is い (live-verified).
- **Retrieval ladder, kana-shaped**: recognition ("which sound?", distractors from other kana readings,
  the item's own alternates excluded so a distractor can never also be correct) → **typed romaji**
  (stages 2–5; a new raw mode on TypedCard — no kana IME conversion, case-folded match against Hepburn
  + alternates; 🔊 speaks the character, not English romaji) → recall (KanaCard: romaji + the KanjiVG
  stroke animation through the existing StrokeViewer). Kana skip production MC — typing the sound IS
  their production. Script label (ひらがな/カタカナ) shows on first encounter.
- **A fresh profile now starts at the true beginning**: default levels are `['L0','L1']` — kana intro
  first (the L1 pool becomes readable as the syllabary lands). **Placement seeds kana too**: any real
  placement (≥L1) marks the L0 syllabary provisionally known — the learner just answered kana-cued
  recognition questions — with the confirm-or-drop mechanic (D-021) covering individual gaps.
  `levelsUpTo` includes L0 in every result. Life stages are untouched (their walk is hardcoded L1→L5),
  so "Tourist" remains the base — kana are the flight over, not a residence stage.
- **Honest counts**: `levelItemCount` now counts studyable domains only (vocab/kanji/kana/grammar/
  sentence) so the L0 chip reads 142, not a kana+strokes double-count — this also makes every other
  level chip an honest "items you study" number.
- **Test hardening**: one parallel-load `waitFor` flake surfaced in `useToday.test.ts` with the heavier
  content set; its mode-ready waits got real headroom (10s), assertions unchanged, suite green 3×
  consecutively (225 tests).
Verified: 29 packs / 15,473 items validate green; live-browser beginner flow (あ first, gojūon order,
`si` accepted for し, stroke animation on recall, L0 chip = 142), placement flow (13,111 states incl.
142 provisional kana, all six chips), zero console errors.
*Source: Session 17 (the Immersion Pass), 2026-07-15; researched kana pedagogy + Playwright verification.*

### D-024: M3 transit — the second errand world
The Immersion Pass, slice 2: the day loop's variety mechanisms (stalest-first sort, multi-errand cap)
finally bind against real competition — Today now offers **Konbini checkout** and **Catch your train**.
- **Same D-002 recipe as M2 (D-017)**: 26 curated expression+reading tags applied to already-committed
  dataset vocab (58/58 total assignments matched; L1 38 / L2 11 / L3 9 tagged items across both
  modules — the errand deepens as levels unlock), plus 7 verbatim announcement phrases cited to the
  sources curriculum.md M3 already lists (My Nihongo Sensei's announcements guide; japan-guide forum) —
  まもなく、1番線に電車が参ります。/ 危ないですから、黄色い線までお下がりください。/ ドアが閉まります。
  ご注意ください。/ この電車は各駅停車です。/ お出口は右側です。/ 駆け込み乗車はおやめください。/
  ご乗車ありがとうございました。 Registers include genuine keigo_humble (参ります) — real announcement
  keigo heard from day one (the §3.6 reception clock).
- **A five-beat escalating arc** mirroring the konbini's (D-020): recognize (decode the platform sign)
  → recall → produce (type your route word) → speed (read the flashing display before the doors shut)
  → context (pick which announcement you're listening for as your stop nears). `sceneKind` gains
  'transit' — the exhaustive title/speaker/backdrop maps forced every integration point at compile time.
- **The speaker is the station, not a clerk**: the VN nameplate is per-sceneKind (店員 · Clerk vs
  放送 · Announcement) — an announcement world speaks in broadcasts.
- **A second hand-authored flat-vector backdrop** in the D-017 language: ekimeihyō station sign
  (white board, indigo band), waiting train (indigo body, paper windows, hinomaru-red stripe), and the
  yellow platform warning strip the cited announcement points at — all palette tokens, dark-mode-correct
  automatically.
- **Unlock threshold 0** (like M2): arriving by train is diegetically day-one, and two always-available
  errands are what make the stalest-first rotation meaningful. Pipeline per-level pack readers now skip
  levels without a domain file (L0 has only kana/strokes) — caught before it could break build-modules.
Verified: validate green (29 packs / 15,481 items); live-browser both color schemes: two errands on
Today, the full five-beat transit arc (honest MISS on a junk produce answer), the context beat lands on
お出口は右側です among real announcement lines, receipt mixes words + the line — zero console errors.
*Source: Session 17 (the Immersion Pass), 2026-07-15; Playwright verification.*
