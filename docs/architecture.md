# Architecture — Hikkoshi (Concept A) on the Shared Engine

**Scope.** Technical blueprint committed before any scaffolding (per brief, Session 4 first task). Concept: **A · Hikkoshi** (D-006) on engine E1–E8 (`design-options.md`). Constraints of record: Vite + React + TypeScript PWA, static GitHub Pages deploy via CI, no backend, IndexedDB for progress/SRS, localStorage for settings only, offline-capable, content as Zod-validated JSON packs with provenance (D-001/D-002), GSAP motion (D-003), level tags community-estimated and disclosed (D-005).

---

## 1. System overview

```
┌────────────────────────── build time (Node, CI) ──────────────────────────┐
│  content pipeline: fetch → normalize → join levels → filter → emit packs  │
│  (JMdict, KANJIDIC2, KanjiVG, Tatoeba, Waller-derived tags, curated       │
│   grammar/scene sources)  →  content/packs/** + attribution manifest      │
└────────────────────────────────────────────────────────────────────────────┘
                                      │ (static files, precached versioned)
┌────────────────────────────── runtime (browser) ───────────────────────────┐
│ App shell (React Router, theme, install/update flow)                       │
│  ├─ Content: PackLoader → PackRegistry (validated, cached in IndexedDB)    │
│  ├─ Scheduler: SRS engine + load shaper  (item states in IndexedDB)        │
│  ├─ Day loop: DayPlanner → ErrandRunner (SceneAssembler) → Diary           │
│  ├─ Progression: LifeStage manager, module unlocks, placement probe        │
│  ├─ Interaction primitives (recognition/recall/production/speed/context)   │
│  ├─ Audio: WebAudio SFX + speechSynthesis(ja-JP) wrapper w/ capability     │
│  │         detection and text-first fallback (E8)                          │
│  ├─ Motion: GSAP layer (scene transitions, mastery transformations)        │
│  └─ Portability: progress export/import (JSON file), pack import           │
└─────────────────────────────────────────────────────────────────────────────┘
```

No network calls at runtime except same-origin static assets. No accounts, no telemetry; all state is local and exportable.

## 2. Repository layout

```
/                       Vite app (src/, public/, index.html)
src/
  app/                  shell, routing, settings, install/update UI
  content/              PackLoader, PackRegistry, schema re-exports
  scheduler/            srs.ts, loadShaper.ts, retrievalMode.ts
  scenes/               SceneAssembler, template interpreters, beats
  day/                  DayPlanner, ErrandRunner, Diary
  progression/          lifeStage.ts, unlocks.ts, placement/
  interactions/         primitives (tiles, typed-kana, timed-decode, …)
  audio/                tts.ts (capability probe), sfx.ts
  motion/               gsap wrappers, reduced-motion support
  store/                IndexedDB access (idb), progress import/export
packages/
  schemas/              Zod schemas shared by app AND pipeline (single source)
pipeline/               Node+TS scripts (fetch, transform, emit, validate)
content/
  packs/                emitted packs (build artifacts, committed*)
  curated/              hand-written sources: grammar points, scene templates,
                        module inventories (each entry carries citations)
docs/                   research.md, curriculum.md, design-options.md, this file
.github/workflows/      ci.yml (typecheck, lint, test, validate, build, deploy)
```

\* Emitted packs are committed (not just built) so the deployed site, the repo history, and the attribution manifest stay auditable; CI re-derives and diffs them to catch drift (§7).

## 3. Component map (runtime)

- **PackLoader / PackRegistry** — fetches pack JSON (same-origin), validates with shared Zod schemas, stores validated packs + version in IndexedDB; exposes typed queries (`itemsByLevel`, `itemsByModule`, `templatesForScene`). Refuses to load packs whose `license`/`sources` fields are missing (D-002 enforced at runtime, not just CI).
- **SRS engine** (`scheduler/srs.ts`) — pure functions over `ItemState` (§5); no timers, no classes; fully unit-testable. `dueItems(now, states)`, `applyReview(state, outcome, now)`, `introduceItems(...)`.
- **Load shaper** — places next-due dates onto the lightest day within a ±15% window and throttles daily introductions (E1/P3); pure function so schedules are reproducible in tests.
- **Retrieval-mode selector** — maps SRS stage → interaction family (E2 table), with per-item-type overrides (kanji get stroke/shape modes; grammar gets transform modes).
- **DayPlanner** — morning screen; picks 2–4 errand scenes: inputs = due items (scheduler), unlocked modules (progression), scene variety history (anti-staleness: no template repeats within N days). Emits a `DayPlan`.
- **SceneAssembler / ErrandRunner** — instantiates a `SceneTemplate` by filling slots with concrete items (due first, then known-context filler per the majority-known rule, curriculum §5 P1); runs beats; every interaction resolves to `applyReview` outcomes. Model-written framing text lives in templates (curated, cited); item payloads come only from packs (D-002).
- **Diary** — end-of-day reading pass: composes today's items into short entries using Tatoeba sentences and template lines (informative-context re-encounter, van den Broek et al. 2022 — see curriculum §5); tap-to-gloss (recognition credit only).
- **LifeStage manager** — L0–L5 gates on item-state coverage thresholds per level pack (not XP); module unlocks by coverage (E5/curriculum §5 P5).
- **Placement probe** — "city-hall interview" (diegetic, E5): difficulty-ordered adaptive branching over tagged items (kanji recognition → vocab → grammar), initializes states as `provisional` (fast-track intervals, drop on first failure). IRT-informed, explicitly not a validated instrument (in-app copy per E5).
- **Audio wrapper** — capability probe at first run (are ja-JP voices present? latency?); per-scene `audioMode: 'tts' | 'text-first'`; all TTS labeled synthetic (E8). WebAudio for SFX only.
- **Motion layer** — GSAP timelines for scene transitions and the mastery-transformation effect (world text de-translating as items mature, P5); respects `prefers-reduced-motion`.
- **Store** — thin `idb` wrapper; three object stores: `packs`, `itemStates`, `journal` (append-only review log). LocalStorage: settings only (D-001).
- **Import/export** — progress JSON (schema-versioned, includes journal tail + states + life stage); pack import validates against the same schemas and quarantines unknown versions.

## 4. Pack format & schemas (Zod; `packages/schemas`)

All schemas versioned (`schemaVersion`), additive evolution only; breaking changes bump major and ship a migration in `store/`.

```ts
// Pack envelope — every pack, no exceptions (D-002, D-005)
Pack = {
  schemaVersion: string,          // semver of schema
  packId: string,                 // e.g. "vocab.l1.core", "scene.l1.konbini"
  packVersion: string,            // semver of content
  title: string,
  license: { spdx: string, notes?: string },          // e.g. "CC-BY-SA-4.0"
  sources: Source[],              // provenance, REQUIRED non-empty
  levelTagSource?: string,        // e.g. "waller-tanos via elzup@<commit>"
  levelTagLicense?: string,       // "CC-BY"
  verification: { status: "dataset-verified" | "curated-cited" | "unverified",
                  method: string, date: string },
  items: Item[] | templates: SceneTemplate[]
}
Source = { name: string, url: string, retrieved: string, license: string }

// Item types (discriminated union on `kind`)
VocabItem   = { kind:"vocab", id, jmdictSeq: number, expression, reading,
                senses: {gloss: string[], pos: string[]}[],
                level: "L0".."L5", levelSpread?: string[],   // disagreeing sources
                modules: ModuleTag[], audioHint?: string }
KanjiItem   = { kind:"kanji", id, literal, kanjidicRefs, grade?: number,
                jlptOld?: 1|2|3|4, level, strokes: { kanjivgId: string },
                readingsOn: string[], readingsKun: string[], meanings: string[] }
GrammarPoint= { kind:"grammar", id, name, level, summary,                 // original prose
                citations: Source[],                        // ≥1 REQUIRED (D-005)
                textbookAnchors?: {book:"genki1"|"genki2"|"quartet1"|"quartet2"|…,
                                   chapter:number}[],
                transforms?: TransformRule[] }              // e.g. keigo/contraction maps
SentenceItem= { kind:"sentence", id, tatoebaId: number, ja, en,
                attribution: { author: string, license: "CC-BY-2.0-FR" | "CC0" },
                levelEstimate, coverage: { knownRatioBasis: string } }
PhraseTemplate = { kind:"phrase", id, module: ModuleTag, register: Register,
                   pattern: string /* slots: {item:query} */,
                   citations: Source[] }                    // register facts cited

// Scene templates (curated packs)
SceneTemplate = { id, sceneKind: "konbini"|"transit"|"cityhall"|"clinic"|…,
                  minLevel, modules: ModuleTag[],
                  beats: Beat[],                            // ordered interactions
                  framing: { text: string, lang:"en"|"ja", modelWritten: true }[],
                  slotQueries: Record<slot, ItemQuery> }
Beat = { interaction: "recognize"|"recall"|"produce"|"speed"|"context",
         slotRefs: string[], register?: Register, timed?: {ms:number} }

// SRS state (IndexedDB, exported in progress JSON)
ItemState = { itemId, stage: 0..7, due: epochMs, introducedAt, provisional?: boolean,
              lapses: number, lastOutcomes: bitpacked, leech?: boolean }
JournalEntry = { itemId, ts, sceneId, interaction, outcome: "pass"|"fail"|"partial",
                 latencyMs?: number }                       // append-only; FSRS-ready
ProgressExport = { schemaVersion, exportedAt, lifeStage, settingsHash,
                   itemStates: ItemState[], journalTail: JournalEntry[] }
```

**Module tags:** `M1_katakana … M10_handwriting` exactly as defined in `curriculum.md` §4.
**Registers:** `plain | polite | keigo_respectful | keigo_humble | casual | service_script`.

## 5. SRS algorithm (with justification)

**Design: a stage ladder with success-history nudges, a strict load shaper, and journal-first storage.**

- **Stages & base intervals:** `0:new, 1:4h, 2:1d, 3:3d, 4:1w, 5:3w, 6:2mo, 7:5mo("settled")`. Pass → +1 stage; fail → −2 (min 1) and `lapses++`; `partial` (e.g., reading right/meaning wrong) → stay, due in 1d. Three lapses in 30 days → `leech: true` → forced variety (different retrieval modes/scenes) rather than more of the same.
- **Nudges, not ease-hell:** per-item multiplier in `[0.8, 1.3]` from recent outcome bits; no unbounded ease factor (Anki's "ease hell" is a known failure mode of multiplicative ease — design judgment).
- **Why this shape:** the evidence ranks *that* spacing exists far above *which* schedule: distributed practice is robust (Cepeda et al. 2006), desired retention interval should stretch gaps (Cepeda et al. 2008), but expanding vs equal schedules showed no reliable difference (Karpicke & Bauernschmidt 2011; small L2-only advantage in Nakata 2015) — all verified in `curriculum.md` §5/§7. So we spend complexity where evidence is strong — **load shaping and retrieval-mode variety** — and keep interval math boring, tunable, and testable.
- **Load shaper:** due dates snap to the lightest day within ±15% of the ideal gap (Renshuu's verified anti-clumping pattern, research.md P3); daily introduction cap default 10 (settings-tunable); rush-day protection: if a day's due count exceeds a ceiling, lowest-stakes items slide first and the Diary absorbs overflow as context-stage re-encounters.
- **Retrieval-mode by stage** (E2): stages 0–1 recognition, 2–3 cued recall, 4–5 production (register transforms unlock here), 6 speed, 7 context/error-noticing. Blocked intro for new items; interleaving applies within review sets for confusables (Brunmair & Richter 2019 word-material caveat honored; Rohrer 2012 discrimination rationale — curriculum §5 P4).
- **FSRS-upgradeable:** the append-only `journal` retains full review history, so a future memory-model upgrade (e.g., FSRS-style fitting) can be evaluated offline against real logs without a schema break. We do not ship a claimed-optimal model we can't validate (honesty rule).
- **Determinism for tests:** all scheduler functions take `now` and a seeded RNG; golden-file tests simulate 180-day learner trajectories and assert load ceilings, no starvation, and stage-distribution sanity.

## 6. Content pipeline (build-time, `pipeline/`)

Stages (each a separate script, idempotent, checksummed inputs → committed outputs):

1. **fetch** — download JMdict_e.gz, kanjidic2.xml.gz, KanjiVG release, Tatoeba ja/en sentence+link exports, Waller-derived tag mirrors (pinned commits); record `{url, sha256, retrievedAt}` into `content/sources.lock.json`. Licenses re-verified against the recorded SPDX at this step (fail if changed).
2. **normalize** — stream-parse to normalized JSONL intermediates (never committed): vocab entries, kanji entries, sentences with pair links + authorship (attribution retained per Tatoeba CC BY 2.0 FR).
3. **tag-join** — attach N-level tags: vocab by expression+reading match against Waller-derived lists (unmatched → `review-queue.json`, not silently dropped or guessed); kanji by `jlpt_new`, with `jlptOld`, `grade`, `freq` kept as secondary signals; record `levelSpread` where sources disagree (D-005 disclosure data).
4. **sentence-filter** — per level: keep Tatoeba pairs whose token coverage against the cumulative level vocab ≥ threshold (majority-known rule), length bounds, dedupe, profanity/quality screens; every kept sentence keeps `tatoebaId` + author attribution.
5. **curated-merge** — validate `content/curated/**` (grammar points with ≥1 citation each; scene templates; module inventories with their `curriculum.md` citations); reject any curated language item lacking a source (D-002 gate).
6. **emit** — write `content/packs/{level}/{domain}.json` + `content/packs/manifest.json` (pack list, versions, sizes, integrity hashes) + `content/ATTRIBUTION.md` (generated: every source, license, and on-screen attribution strings — EDRDG/KanjiVG/Tatoeba/Waller requirements from curriculum §3.4).
7. **validate** — run the same Zod schemas the app uses (imported from `packages/schemas`); CI fails on schema, missing-provenance, license drift, or unexplained count drift vs the previous manifest (>2% change requires a `CHANGES.md` note).

Pipeline runs locally/CI on demand — packs are build artifacts *and* committed source of truth (§2 note). Dataset refresh is an explicit PR, never a silent side effect.

## 7. PWA & offline

- **Manifest** (installable, standalone, theme per visual identity session) + service worker via `vite-plugin-pwa` (workbox under the hood): precache = app shell + `manifest.json` + current-level packs; other level packs runtime-cached on first touch with a "download level for offline" control.
- **Versioned precache synced with build output** (brief requirement): the SW precache list is generated from the actual build + pack manifest in CI — no hand-maintained lists.
- **Update flow:** new SW → in-app toast ("New version — reload"); no silent reloads mid-scene; progress store is schema-migrated on first open after update.
- **Storage budget:** target < 25 MB precache (L1 packs + shell); audio is TTS-generated at runtime (no bundled audio in v1 — E8 caveat shown), keeping packs text-only and small.

## 8. CI (GitHub Actions → Pages)

`ci.yml` on PR + main: install → typecheck → lint → unit tests (scheduler golden files, schema round-trips) → **pipeline validate** (schemas, provenance, attribution manifest, count-drift) → build → SW/precache integrity check → deploy to Pages on main. A `weekly-sources` workflow (manual-trigger initially) re-runs fetch+validate to detect upstream dataset/license drift without auto-merging.

## 9. Session 4+ build order (one task per session, per D-004)

1. Scaffold Vite+React+TS+PWA shell with CI deploying a hello-world to Pages (proves the rail end-to-end).
2. `packages/schemas` + pipeline stages 1–3 (fetch/normalize/tag-join) with tests; commit `sources.lock.json`.
3. Pipeline stages 4–7; commit first real packs (L1 vocab/kanji + attribution manifest).
4. Scheduler + store + golden-file tests (no UI).
5. Interaction primitives + first scene template (konbini) end-to-end on L1 pack.
6. Day loop (planner → errand → diary) + life-stage gates.
7. Placement probe.
8. Visual identity pass (GSAP motion system, D-003) — dedicated session with frontend-design skill.
9. Audio wrapper + capability probe + text-first fallbacks.
10. Import/export + offline level downloads + install/update UX polish.
Each session ends done/verified/remaining; each lands atomic commits.

## 10. Verification plan for this document's claims

Everything normative here traces to: the brief (stack constraints), decisions D-001–D-006, `curriculum.md` (counts, licenses, module inventories, learning-science citations — all verification-passed), and `design-options.md` (engine E1–E8). New engineering judgments introduced here and flagged for validation spikes: TTS capability probe design (§3 audio), storage budget (§7), no-bundled-audio v1 (§7), SRS parameter defaults (§5 — tunable, golden-tested, journal-first so they can be refit against real usage).
