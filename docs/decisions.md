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
