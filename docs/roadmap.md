# Roadmap — the next batches (written for execution)

> **Superseded.** All five batches below shipped (D-027…D-031), followed by D-032 and D-033.
> The active plan is **[docs/roadmap-2.md](roadmap-2.md)** — the Classroom Companion
> (D-034…D-039). This file remains as the record of the first execution pass.

Written at Session 18's close (after D-026, the Overhaul Pass). Each batch below is sized like one
past session and is **self-contained**: an executor with no prior context should be able to open
this file, pick the next batch, and ship it. Batches are ordered by recommendation; each ships in
slices, and **every slice lands green** (gate → live verify → commit → push) so an interrupted
session still leaves the app deployable.

> **Status (updated Session 19):** all five batches below shipped — Batch 1 → D-027, Batch 2 →
> D-028, Batch 3 → D-029, Batch 4 → D-030, Batch 5 → D-031 (see `docs/decisions.md`). Batch 3
> delivered yōon; sokuon/chōon were deferred within it (rationale in D-029). Batch 5 kept the
> emergency phrases as a reference rather than adding them to the review pool (rationale in D-031).
> The "Deferred (future)" list at the bottom is the live backlog for the next session.

## Standing rules (apply to every batch — these are settled, do not re-litigate)

1. **D-002 is non-negotiable**: no invented Japanese, ever. Every expression/reading/sentence/level
   tag comes from the datasets or a cited curated file (`content/curated/**` with citations;
   `pipeline:validate` enforces provenance). Imagery follows the same culture via
   `src/assets/photos/PHOTOS.md` (licensed, ledgered, bundled — never hotlinked).
2. **The full gate**, after every slice:
   `npm run typecheck && npm run lint && npx vitest run && npm run pipeline:validate && npm run build`
3. **Live verification per slice**: drive the real app in a browser (dev server, conventionally
   port 5180) across light + dark + reduced-motion with a console-error listener; zero errors is
   the bar. See "Environment notes" for the Playwright specifics that bite.
4. **Push cadence**: the dev branch `claude/jlpt-game-research-7a5aoe` is also the default branch —
   every push triggers CI build + deploy to GitHub Pages. Deploy proof without GitHub API access:
   compare local `dist/assets/index-*.js` hashes against the live
   `https://carlob2499.github.io/JapaneseLearningApp/sw.js` precache manifest (the deploy job only
   runs after the build check passes, so a hash match proves CI green).
5. **Docs ledger**: each batch ends with a `docs/decisions.md` entry (next: D-027) recording the
   judgment calls, and an `src/ui/About.tsx` update whenever honest limits change. `decisions.md`
   is the only "what shipped" ledger — nothing else gets annotated.
6. **Session close**: deliver the live link — https://carlob2499.github.io/JapaneseLearningApp/
   (standing user request).
7. Dark mode and reduced motion are correctness, not polish: every new tween collapses via
   `isReducedMotion()` (informative marks still *appear*), every new color reads from tokens.

## Environment notes (hard-won — read before writing any verification script)

- **Playwright**: the project pins a newer playwright than the pre-installed browsers; launch with
  `executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'` (adjust to what exists
  under `/opt/pw-browsers/`) and never run `playwright install`. Scratch scripts outside the repo
  need `NODE_PATH=<repo>/node_modules`.
- **Never freeze the clock around GSAP**: `page.clock.setFixedTime` freezes GSAP's ticker
  (performance.now), so any GSAP-driven navigation never completes. For clock-dependent checks,
  pre-set `localStorage['hikkoshi:onboarded']='on'` so Home renders without animated navigation.
- **Selectors**: state-gate on structural selectors (`.life-stage-badge`, `[data-testid=…]`),
  never loose text (a past bug: `text=Tourist` matched onboarding copy). Correct MC answers are
  clickable via `[data-testid="choice"][data-correct="true"]`. Scenes put framing steps behind
  `.scene-continue-btn` before the first card.
- **Shell**: `pkill -f vite` exits 144 and kills chained commands — run it alone and tolerate the
  code. Timed waits: precompute the target (`target=$(($(date +%s)+N)); while [ $(date +%s) -lt
  $target ]…`) — re-evaluating the deadline in the loop head never terminates.
- **CSS traps already paid for**: equal-specificity restyles can out-cascade state classes purely
  by import order (see the `.scene-view .choice.correct` fix); `--paper` is dark in dark scheme —
  photo-overlay text must swap to `--ink`; a button whose children are all `position:absolute`
  collapses to 0×0 under `justify-items:center` (needs definite width).
- On-device data for manual testing: the fastest seeded profile is the placement probe answered
  with `[data-correct="true"]` 8× (~15k provisional states, all stamps pressed).

---

## Batch 1 — Checked-in Playwright smoke suite, wired into CI (D-027)

**Why first.** Every "Playwright-verified" to date was an interactive session, not a regression
test; the D-026 walkthrough caught a legibility bug that had shipped invisible since Phase 3. A
committed smoke suite converts that one-off protection into a permanent gate — and it protects
every batch after this one. Highest leverage per line of code in this list.

**Slices**
1. *Harness*: `@playwright/test` config (`e2e/` directory) targeting `vite preview` of the built
   `dist/` (what actually deploys), with projects for light, dark (`colorScheme`), and reduced
   motion (`reducedMotion: 'reduce'`). CI: a job between build and deploy —
   `npx playwright install chromium --with-deps` works on ubuntu runners (the local-environment
   restriction above is remote-session-specific; CI installs normally). Deploy depends on it.
2. *Smoke specs*, translated from Session 18's `final-walkthrough` script (three scheme runs,
   zero-console-error assertion is part of every spec):
   - Onboarding: arrival band renders; both forks (beginner → Home; placement → 8 correct → Home).
   - Review: MC correct pick (maru appears), typed kana answered from a `content/packs/l0/kana.json`
     romaji map, reveal/grade flow.
   - Scene: konbini entry → continue through framing → correct pick shows the **green** fill
     (regression-pins the D-026 cascade fix) → leave.
   - Journey: stamps pressed and settled; reduced-motion project asserts stamps are present
     immediately at full opacity.
   - About: attribution paragraphs present (EDRDG/KanjiVG/Tatoeba + photo credits).
3. *Docs*: D-027 entry; note in About only if user-facing behavior changed (it shouldn't).

**Acceptance**: suite green locally against `dist` in all three projects; CI runs it on push;
deploy blocked when it fails. Keep total runtime under ~3 minutes (smoke, not exhaustive).

## Batch 2 — Listening: the missing modality (D-028)

**Why.** The retrieval ladder covers eye-first modes only (recognition/production/typed/recall);
listening is a full JLPT section, and `docs/curriculum.md` §"honest-limitations carry-over"
already designed for this: browser TTS, text-first fallback, graceful degradation.

**Design decisions (settled here so the executor doesn't re-open them)**
- New mode `'listening'` in `RetrievalMode` (`packages/schemas/src/progress.ts:15`) — audio-first
  recognition: the prompt is a 🔊 replay button and *no text*; options are the existing verbatim
  choice pools (vocab: gloss options; kana: romaji options; sentence: en options).
- **Availability is a plan-time check, not a render-time one**: `retrievalModeFor` gains an
  `opts.audio?: boolean`; callers pass `hasJapaneseVoice()` (`src/audio/tts.ts`). Without a
  Japanese voice the schedule falls back to today's behavior exactly — a voiceless device must
  never see a silent card. jsdom tests exercise the no-voice branch by default.
- Mode placement: for vocab and kana, listening replaces ~one slot in the mid stages (e.g. vocab
  stage 4 alternates typed/listening by a deterministic seed; kana stage 3–5 mixes typed/listening).
  Keep `MODES_BY_KIND` (`src/review/choices.ts:55`) the source of truth; extend the leech rotation
  automatically by adding the mode there.
- `ListeningCard` in `src/ui/cards.tsx`: auto-plays once on mount when auto-play is on, replay
  button always; after answering, reveals the text (so the card teaches, not just tests). Maru and
  pulse/shake conventions apply unchanged.
- Scene stretch (only if the batch is running early): an "overhear" beat variant for M3 transit —
  the announcement is *spoken* (existing cited announcement phrases), learner picks the meaning.
- About: honest-limits paragraph — device-voice dependency, quality varies by platform, mode
  simply absent without a Japanese voice.

**Acceptance**: with a ja-JP voice, listening cards appear at the designed stages and grade
normally; without one, the app is byte-identical in behavior to today; suite from Batch 1 extended
with one listening spec (Chromium has no ja voice in CI — assert the *fallback*, which is exactly
the guarantee that matters).

## Batch 3 — Complete the syllabary: yōon, sokuon, chōon (D-029)

**Why.** About currently discloses: "Combined characters like きゃ aren't drilled separately yet."
L0 is the front door; finishing it removes the app's earliest honest limitation. All content is
dataset-derivable (kana composition is mechanical; romaji per Hepburn with accepted variants —
same rules as D-023).

**Design decisions**
- Extend `pipeline/src/kana.ts` `KANA_ROWS` with yōon (きゃ…りょ + voiced ぎゃ…びょ/ぴょ = 33 per
  script, 66 items), sokuon っ/ッ, and the chōon mark ー (katakana row) — ~70 new items, total ≈212.
- `KanaItem` schema: `char` becomes 1–2 chars; strokes for compounds join **per component** —
  change `kanjivgId: string` to `kanjivgIds: string[]` (one entry per glyph; existing single-glyph
  items migrate to one-element arrays; `kanjivgIdFor` already maps each codepoint). The app's
  stroke join (`src/review/useReview.ts`) and `KanaCard` render one `StrokeViewer` per component.
  This is a schema change: bump pack hashes via re-emit, keep `pipeline:validate` green.
- Typed accept-variants (extend the D-023 table): sha/sya, shu/syu, sho/syo, cha/tya, chu/tyu,
  cho/tyo, ja/zya/jya, ju/zyu/jyu, jo/zyo/jyo, plus ぢゃ/づ rows mapping to ja/ju/jo/zu. Sokuon and
  chōon are taught in context rows (っ→"double the next consonant", ー→"long vowel") — their typed
  answer is the romaji of the *displayed* compound example if standalone drilling proves awkward;
  the executor may instead fold っ/ー into recognition-only items (record the call in D-029).
- Curriculum order: yōon rows append after all base+voiced rows (gojūon order preserved within);
  `buildPool`'s kana-first blocking needs no change.
- Placement seeds (`src/placement/seed.ts`) automatically include the new items via
  `reviewablePoolIds` — verify count changes in tests that assert totals (L0 chip count in
  `src/lib/appMeta.ts` tests, journey "142" assertions, About copy).

**Acceptance**: pipeline emits the enlarged L0 pack with strokes for every component
(`build-kana` fails loudly on gaps); all count-bearing UI/tests updated; a new learner meets yōon
after the base rows; About's "not drilled yet" line replaced.

## Batch 4 — The perspective flip: behind the counter (M7 production, D-030)

**Why.** The curriculum's own escalation trace (§"Principle 2") and About both promise it:
"Producing full keigo from behind the counter … arrives with the higher levels." The stamps now
narrate Part-timer/Employee — this batch makes the *job* playable, the strongest narrative payoff
available with content that already exists (M2's cited clerk lines + `service_script` register
sentences; no new language needs inventing).

**Design decisions**
- New scene in `content/curated/scenes/` with `sceneKind: 'konbini'` reversed roles: the learner
  is the clerk. Beats escalate: pick the right service line for the moment (context) → type the
  keigo line's reading (produce) → speed beat on the register. Every line verbatim from the cited
  phrase inventory (`content/curated/phrases/l1.json` + M2 module tags); if a needed line is
  missing, *cite and add it to the curated file* — never invent.
- Gating: the errand appears in `dayPlan` candidates only at life stage ≥ 2 (Part-timer) — the
  scene template gains an optional `minStage` field (schema + `useToday` filter). The Journey
  note for Part-timer already reads "First shift." — the tile title: "Your shift at the register".
- `SCENE_KIND_TITLE`/`ERRAND_PHOTO` reuse the konbini entries unless a distinct photo is added
  (if so: Commons, ledgered in PHOTOS.md, credited in About — same D-026 process).
- Register pedagogy: production here is *scripted* keigo (fixed service lines), which is exactly
  M7's "entry N4 recognition, N3+ production" shape — About explains that free keigo composition
  is still ahead.

**Acceptance**: a placed profile at stage ≥ 2 sees the shift errand; a beginner never does; the
scene plays all beats with cited lines; journal/SRS integration identical to existing scenes
(phrase beats journal without item states; item beats grade normally).

## Batch 5 — M9 safety-critical core (D-031)

**Why.** The curriculum ranks M9 among the strongest-evidence modules and mandates: "N5 emergency
micro-script (119, address, 助けてください) taught early **regardless of level**." No other module
carries that instruction. Smallest batch here; highest real-world stakes.

**Design decisions**
- A small curated module `m9_emergency.json` + cited phrases (government/emergency-services
  sources per curriculum §M9 — citations are the bulk of the work; the phrase list is short).
- Surface: a "Just in case" card — reachable from About or a Home fineprint link, *not* an errand
  (an emergency is not a daily loop). It presents the micro-script (119 vs 110, stating your
  address, 助けてください / 救急車をお願いします) with 🔊 and romaji, always available offline.
  Optionally: the phrases also join the reviewable pool tagged to the module, introduced early
  (curriculum's "taught early" instruction) — executor's call, recorded in D-031.
- This is content-heavy and code-light: budget the session accordingly (verification effort goes
  into citation checking, the D-002 hard gate).

**Acceptance**: every phrase cited; the card renders offline in all schemes; About discloses what
the feature is and is not (not medical advice; a phrasebook with audio).

---

## Deferred (recorded, intentionally not next)

Kisetsu seasonal palette rotation and the study-card serif extension (D-019 deferrals); free keigo
composition beyond scripted service lines; handwriting *input* (stroke tracing — StrokeViewer
displays only); graded readers (licensing research needed first — Tadoku volumes are mostly
CC BY-NC-**ND**, which blocks adaptation; do not bundle without resolving this); M1/M4/M5/M6/M8/M10
modules (follow curriculum evidence order when their turn comes); recorded human audio.
