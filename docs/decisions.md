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
