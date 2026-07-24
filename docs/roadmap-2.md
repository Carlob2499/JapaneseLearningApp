# Roadmap 2 — The Classroom Companion (D-034 … D-039)

**For the executing model (Sonnet).** This document is self-contained: it carries everything you
need — the learner's real situation, the evidence base, the product design, per-batch specs, and
the standing rules. Execute the batches **in order**, one slice at a time, with the full gate and a
commit+push after every slice. Do not start a batch until the previous one is green on CI. Where
this doc says "decide at walkthrough," make the call yourself and record it in `docs/decisions.md`.
Read `docs/decisions.md` D-001…D-033 before starting — every rule there still binds. Load the
`frontend-design` skill before building any new surface in Batches 1, 3, 4, or 5.

**Branch: `main`.** Verify before the first commit that `git remote show origin` reports
`HEAD branch: main`; if it still reports the old `claude/…` branch, the Pages deploy will not fire —
tell the user to flip the default branch in GitHub Settings → Branches, and continue working on
`main` regardless (CI checks still run on every push).

---

## 1. Why this exists — the learner's actual situation

The owner attends a **weekly in-person Japanese class (Wednesday evenings)**, ten sessions per
term, and has climbed four consecutive levels over the past year. The current course runs
**QUARTET I** (Japan Times; the intermediate successor to Genki II). Position as of late July 2026,
established from the class's own weekly materials:

- Term = Quartet I **Lessons 1–2** over ten weeks. Week 8 (2026-07-22) covered L2 grammar #7–9:
  **〜ば〜ほど** (p46), **(まるで)〜のようだ** (p48), **〜ことになる／〜ことになっている** (p48),
  vocab #20–26 (季節・気をつける・拝啓・暑い・頃・過ごす・短い), the L2 reading (a keigo email
  requesting a recommendation letter), and a **six-kanji handwriting sheet** (短・合・公・園・酒・機).
- Earlier weeks: L1 〜とおりに (Day 1), N4-bridge review ようになる/ようにする (Day 3),
  L2 〜てくる・〜ていく (Day 6), 〜おかげだ/〜せいだ (Day 7). Two sessions remain (≈ Jul 29, Aug 5),
  then a "Late Summer" continuation term (Lessons 3+).
- Completed prior courses ≈ **Genki II** (chapters 13–23, N4). The learner is bridging N4 → N3.

**The goal (owner's words):** maximum visually-appealing, *nearly-addicting* learning that helps
them **get ahead of and keep up with** these weekly classes. Hikkoshi today is a JLPT-track
life-sim with a strong SRS and a cinematic visual layer (D-033) — but it knows nothing about the
class. That is the gap this roadmap closes: a **Classroom thread** woven through the existing
life-sim (taking a weekly Japanese class *is* part of a life in Japan), an evidence-based weekly
rhythm around the class day, grammar *production* practice shaped like the class worksheets,
kanji handwriting practice shaped like the class kanji sheets, and a research-backed return loop
that pulls gently every day without a single dark pattern.

Personal details (school, teacher, exact dates) stay **out of the repo and out of shipped
defaults**; everything class-specific is user-configurable settings (§5, Batch 1B). Defaults may
assume "Quartet I, class on Wednesday" — that is generic enough.

---

## 2. Evidence base

Compressed from three cited research passes (2026-07-24). Inline citations are load-bearing —
carry the key ones into `docs/decisions.md` entries.

### 2.1 The textbook map (facts; safe to encode)

Quartet I = 6 lessons, each with 読む/書く/話す/聞く + Brush-up; ~700 vocab and 327 kanji across
Vol 1 (~110–120 words, ~50 kanji per lesson); Quartet I ≈ **JLPT N3**, Quartet II ≈ N2
(quartet.japantimes.co.jp/en/about/, /en/faq/; tofugu.com/reviews/quartet-vol1/). Grammar points
per lesson (names are facts; cross-checked against the official Bunpro Quartet I deck
bunpro.jp/decks/kyi3ss and WaniKani study-group threads):

- **L1** (theme: Miyazaki/anime): Nといえば · 〜なら · 〜とおり(に)/Nどおり(に) · 〜らしい ·
  〜ため(に)/〜ためのN · 〜がきっかけで · 〜ようになる · 〜ようにする · Nによると
- **L2** (letters/email): formal 連用形/〜ずに · 〜てくる/〜ていく · しか〜ない · 〜ことにする ·
  「気」expressions (気がする・気がつく・気をつける) · 〜おかげだ/〜せいだ · 〜ば〜ほど ·
  (まるで)Nのようだ · 〜ことになる
- **L3** (travel): 〜うちに/〜ないうちに · 何と言っても · Nにとって · Nとして · 〜ため(に) cause ·
  Nによって/による · 〜べきだ/〜べきではない · 〜からといって · 〜とは限らない · 〜のに (purpose)
- **L4** (study abroad & baito): 〜ような気がする · 〜さえ/〜さえ〜ば · Yほど〜ない · 〜以来 ·
  せっかく · 〜たばかり · 〜ないで済む/〜ずに済む · 〜わけだ · 〜ば〜のに
- **L5** (Japanese food): QW+〜ても · 〜たび(に) · 〜はずだ · 〜ておく/〜ないでおく ·
  まず/次に/それから/最後に · (たとえ)〜ても · 〜ように (so that) · Nにする · 〜だけあって
- **L6** (opinion essays): 〜(という)わけではない · Nからみると/すると/いうと ·
  〜(の)ではないだろうか · 〜がる · 〜(よ)うとする/しない · 〜まま(に) · 〜ようにいう ·
  〜ほど (extent) · わざわざ

Genki II ch. 13–23 grammar (review track; bunpro.jp/decks/g8jfme): potential · し · そうだ×2 ·
てみる · ほしい · かもしれない · あげる/くれる/もらう ×2 · volitional · ておく · 予定だ ·
ていただけませんか · といい · 時 · って · たら · なくてもいい · みたい · transitivity pairs ·
てしまう · と · ながら · ばよかった · おかげで · までに · honorifics · humble · はずだ · ないで ·
embedded Q · という · やすい/にくい · passive · てある · 間に · てほしい · causative · なさい ·
ば · のに · ように/のように · causative-passive · ても · ことにする · まで · 〜方.

**The licensing red line (D-034 must record this).** The Japan Times **actively enforces** Quartet
copyright — the community exercise site sethclydesdale.github.io/quartet-study-resources was taken
down at their request; shared Anki decks of the vocab lists carry no license. Therefore: **never
ingest or reproduce Quartet's vocab lists, glosses, readings, dialogues, or exercises.** What is
safe: grammar-point *names/patterns* (facts, indexed publicly by Bunpro/WaniKani/jlptsensei),
lesson *themes* (facts about the book), self-authored summaries with ≥2 citations (the D-016
grammar precedent), Tatoeba sentences (CC BY 2.0 FR), JMdict glosses (CC BY-SA), KANJIDIC2 +
KanjiVG (CC BY-SA), tanos JLPT lists (CC BY). Lesson-aligned vocab is a **theme-curated selection
of our own open-data items**, never "the Quartet list."

### 2.2 Learning science (what the rhythm engine implements)

1. **Pretesting works and is item-specific** — attempting retrieval of not-yet-taught material,
   with immediate answer reveal, improves later learning of exactly those items (g≈0.54 pretested
   vs ≈0.04 untested; Kornell/Hays/Bjork 2009; Pan & Carpenter 2023, Educ. Psych. Review). So the
   "get ahead" mode is a **guess-then-reveal seed session covering every key upcoming item
   shallowly**, not a passive preview and not a deep drill.
2. **Same-evening consolidation + spaced follow-ups.** Retrieval on class evening exploits
   sleep-dependent lexical consolidation (Dumay & Gaskell 2007); optimal gap ≈ 10–20% of the
   retention interval (Cepeda et al. 2008, Psych Sci) ⇒ for a 7-day cycle: review at class-day+0/+1
   and +3/4. Expanding vs uniform SRS shape is a wash (Kang et al. 2014) — the existing ladder is
   fine; the *class hook days* are what's new.
3. **Format ladder, production-final.** Recall formats beat recognition when production is the
   goal (Nakata 2016); grammar specifically becomes durable through **whole-sentence production
   with feedback, ≥3 spaced successful sessions** (Serfaty & Serrano 2024, Language Learning).
   Practice-testing overall: g≈0.51 vs restudy (Adesope et al. 2017).
4. **Hybrid interleaving.** Brief blocked alternation when a pattern is new, then always mixed
   with confusable siblings (Pan et al. 2019; Nakata & Suzuki 2019, MLJ). Never quiz a grammar
   point only inside its own lesson bucket.
5. **~85% success target** (Wilson et al. 2019, Nat. Commun.): if session accuracy >90%, promote
   formats/intervals harder; <75%, ease off. The scheduler already has the levers.
6. **Selective handwriting.** Writing practice strengthens orthographic form-meaning links (Guan
   et al. 2011, JEP; Lyu et al. 2021 review) — trace **the class's weekly six** and confusables,
   not everything.
7. **Four strands balance** (Nation 2007): the app is heavy on language-focused learning; the
   scene/errand system is its meaning-focused strand — the Classroom thread should route class
   grammar *into* scenes (Batch 3's worksheet beats + existing scene engine), not build a parallel
   flashcard silo.

### 2.3 Engagement mechanics (what the return loop implements — and rejects)

Ranked, evidence-backed, aesthetic-filtered (full report 2026-07-24; key sources: Duolingo's own
retention publications — streaks drive +14% D7, forgiveness mechanics *outperform* punitive ones
(Weekend Amulet +4% return), bingers churn more than pacers; WaniKani's mastery-gated batched
unlocks and terminal "burned" state sustain multi-year use; Anki-abandonment analyses — **review
debt is the #1 SRS killer**; Lally et al. 2010 — missing one day does not harm habit formation;
Kivetz et al. 2006 — goal-gradient + endowed progress; Zeigarnik-effect collection grids):

**Adopt:** capped, warm daily sessions with **no raw backlog number ever shown** · weekly-
consistency framing ("5 of 7 days") with automatic forgiveness, *never* a hard streak reset ·
"days lived in Japan" continuity counter (a streak reframed as narrative) · mastery-gated unlock
of the next lesson's seed (get-ahead as an *earned* door) · endowed progress (bars never start at
0; class attendance itself pre-fills the week) · goshuincho-style collection grids (weekly kanji
sheets → stamps) · habit-stacking around the class anchor (seed the evening before, capture the
evening after) · terminal mastery state (items visibly retire — "words that live here now") ·
small cozy variable rewards through the existing seasonal/cinematic layer.

**Reject (recorded in D-038):** leagues/leaderboards (documented anxiety + off-task grinding),
XP/points currency, guilt copy, hard streak resets, jackpot visuals. The calm aesthetic is not a
handicap — forgiveness mechanics outperform punitive ones on retention itself.

---

## 3. Product design — the Classroom thread

One sentence: **your class becomes part of your life in Japan, and the app becomes the study desk
that makes you the best-prepared person in the room.**

New view: **教室 / Classroom** (view id `classroom`), entered from a Today-card on Home when class
mode is on. It holds: the term map (six lesson panels, mastery-gated), the current lesson's
grammar points with per-point status (met → practicing → **solid** after 3 spaced productions),
the weekly kanji sheet, the readiness dial, and class settings. The Home Today panel gains at most
one class task per day (seed / capture), inside the existing 4-task cap.

**The week, as the app breathes it** (all offsets configurable from the class-day setting):

| Day | Phase | Task surfaced | Session shape |
|---|---|---|---|
| class-day −2, −1 | **予習 seed** | "Seed Wednesday's class" | guess-then-reveal pretest over the next uncovered slice: every upcoming grammar point + ~15 theme vocab, shallow, forgiving (wrong = provisional, never a demotion) |
| class-day | 授業 | (none — the class itself; attendance pre-fills the week ring) | — |
| class-day +0 evening, +1 | **復習 capture** | "Capture while it's warm" | recall-biased retrieval of the current week's items; evening copy |
| +2 … +4 | strengthen | normal review (class items now interleaved into the main queue) | worksheet production beats appear here |
| any | — | errands/scenes as today | class grammar routed into scene beats where patterns match |

**Readiness** = share of current-lesson items at stage ≥2, shown as a dial that fills toward
class day (goal-gradient made honest). ≥85% on class eve = a quiet glow + one warm line. Lesson
mastered (all points solid) = a **lesson hanko ceremony** set-piece (≤2.4s, tap-skip, never under
reduced motion — the D-033 laws).

**Visual language directives** (extend the shironeri/aizome system — never a gamification look):
- Worksheets: paper card with a faint **genkōyōshi grid**, answers graded by the existing
  maru (hankoPop) / shake vocabulary; the red pen is the teacher's voice.
- Weekly kanji sheet: a 2×3 grid of cells echoing the class handout's trace boxes; a completed
  cell holds the character in ink; a completed sheet earns a small vermillion stamp in the
  Classroom's stamp row (goshuincho register).
- Week ring: seven small cells (Mon–Sun), class day marked 授; kept days fill with ink; the whole
  ring is quiet — no numbers screaming, no red warnings, ever.
- The readiness dial: a brush-drawn arc (DrawSVG; reduced = static full arc of current value),
  aizome→vermillion as it approaches ready.
- Type: Japanese labels in the display mincho as established (授業・予習・復習・今週の漢字).
- Motion: all new set-pieces obey D-033 set-piece laws; all new surfaces collapse correctly under
  reduced motion; the jsdom laws hold (no `drawSVG` property and no SplitText construction on
  reduced branches; no `getTotalLength`/`getPointAtLength` reachable in jsdom — see Batch 4).

**Copy voice** (write all copy in this register): calm, second person, in-fiction where natural.
Never guilt. Lapse >3 days → "おかえり — welcome back. Today is short on purpose." Never "You
missed N days," never a backlog count; the session is presented as today's short walk, always.

---

## 4. Non-negotiables (unchanged + new)

1. Full gate per slice, then commit + push:
   `npm run typecheck && npm run lint && npx vitest run && npm run pipeline:validate && npm run build`
   then `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npx playwright test`.
2. **D-002 content rules**: no invented Japanese content. Sentences = Tatoeba verbatim; glosses =
   JMdict-derived; grammar summaries = original English prose with ≥2 citations; kanji data =
   KANJIDIC2/KanjiVG. Short UI-chrome Japanese labels (授業・予習・復習・今週の漢字・おかえり) are
   established practice (D-019/D-026). **Never reproduce Quartet/Genki content** (§2.1 red line).
   Cloze/transform prompts must be substrings or blankings of real Tatoeba sentences — assembled
   prompts may only recombine a pattern with a lemma drawn from a cited real sentence, and the
   full real sentence is always shown after grading.
3. Reduced motion = correctness. Set-pieces never mount under reduced; new components collapse.
4. Never `page.clock` around GSAP; e2e date control only via the existing zero-arg `new Date()`
   shim pattern (`e2e/` precedent from D-033).
5. Bundle discipline: no new heavy deps (**no canvas/drawing library — Batch 4 is pointer events +
   SVG, ~0 deps**); packs stay lean; note precache entry count in each batch's decision entry.
6. Environment gotchas: Playwright browser at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`
   (never `playwright install`); `pkill -f vite` exits 144 — run it alone and tolerate; scratch
   scripts need `NODE_PATH=/home/user/JapaneseLearningApp/node_modules`; jsdom always reports
   reduced-motion ON (test-shape assertions rely on it).
7. No model identifiers in commits/PRs/code. Standard `Co-Authored-By: Claude <noreply@anthropic.com>`
   trailer is fine.
8. Close every session by giving the owner the live link:
   https://carlob2499.github.io/JapaneseLearningApp/ — after confirming the deployed
   `sw.js` precache hash matches the local `dist` build.

---

## 5. Batches

Estimated total: 11 slices. Each slice = full gate + commit + push. Commit messages given below.

### Batch 1 — D-034 · The classbook layer (2 slices)

**Slice A — schema + content.**
- `packages/schemas/src/classbook.ts` (new): `LessonTemplate` = { kind:'lesson', id
  (`lesson:quartet1:1`…), book:'quartet1', lesson:1–6, titleEn (original), themeEn (original),
  grammarIds: string[] (existing + new grammar point ids), vocabMatchers: {expression,
  reading}[] (curated theme selection, resolved to item ids at build; unmatched → build warning,
  not error), kanjiWeeks: string[][] (arrays of 6 literals, learner-editable at runtime — the
  shipped default is our own frequency-ordered N3-tagged selection cross-checked against ≥2 open
  sources, recorded as such), citations[] }. Export from schemas index; Zod-validate in
  `pipeline:validate`.
- Extend the grammar layer: author the **Quartet I points not yet in `content/curated/grammar/`**
  (audit first — ようになる/ようにする/おかげで/ことになる/はずだ/わけだ/ておく and others exist;
  expect ~35–40 new points across L1–L6, level L3 placement unless an inventory says otherwise).
  Same shape as existing entries: original prose, ≥2 citations (Bunpro deck page + jlptsensei or
  Tae Kim), `textbookAnchors: [{book:'quartet1', lesson:N}]`, `patterns` array for Tatoeba
  matching. Add `quartet1` to the TextbookAnchor book enum. Points that find no Tatoeba example at
  build are held back (D-016 rule) — check coverage and swap patterns until ≥1 example each.
- `content/curated/classbook/quartet1.json`: the six LessonTemplates. Vocab matchers: ~40–60 per
  lesson, chosen from our L2/L3 open-data pools by lesson theme (travel words for L3, food for
  L5…). This is our own curation — record the method in D-034.
- Pipeline: emit `content/packs/class/quartet1.json` (small; one new precache entry — note it).
- Tests: schema round-trip; pipeline emits with all grammarIds resolvable; every lesson has ≥6
  grammar points and ≥30 matched vocab.

**Slice B — settings + Classroom view.**
- `src/store/classSettings.ts`: localStorage-backed { enabled, classDay (0–6, default 3),
  book ('quartet1'), lesson (1–6), week (1–10), weeklyKanjiOverride?: string[] } + helpers
  `nextClassDate(now)`, `daysUntilClass(now)`; all pure and unit-tested.
- `src/ui/Classroom.tsx` + `classroom.css`: term map (six lesson panels; future lessons show
  titles only, gated visual per §3), current-lesson grammar list with status chips, weekly kanji
  row (uses override if set; editable via a small in-place editor — user types the six characters
  from their class handout), readiness dial (static value this batch; animates in Batch 5),
  settings row (class day picker, lesson/week steppers, off switch).
- App wiring: `classroom` view in the union + shoji-wipe navigation; Home Today panel gains a
  Classroom entry card when enabled ("授業 · Class in N days") and a one-time discovery card when
  disabled ("Taking a class? →", dismissable, flag in localStorage).
- Tests: classSettings pure fns (all 7 weekdays × phase math); Classroom renders under jsdom
  (reduced) with a seeded profile; App view wiring.

Commits: `The classbook — Quartet I lesson layer, cited grammar to L6 (D-034 pt 1)` ·
`Classroom view + class settings — the term made visible (D-034 pt 2)`

### Batch 2 — D-035 · The weekly rhythm (2 slices)

**Slice A — engine.** `src/day/classWeek.ts` (pure): `phaseFor(now, settings)` →
`'seed' | 'class' | 'capture' | 'strengthen' | 'off'` per §3's table; `buildClassTask(phase,
progressSnapshot)` → new `DayTask` kinds `{kind:'class-seed'}` / `{kind:'class-capture'}` with
item counts; integrate into `dayPlan.ts` (class task takes one of the 4 slots, never displaces
review) and `useToday`. Readiness calculation `lessonReadiness(items, progress)` here too.
Golden-test the full week for each classDay, including skip-week behavior (week stepper not
advanced ⇒ phases repeat — correct, the learner controls advancement).

**Slice B — sessions.** Seed session: reuse the review flow with a `seedMode` flag — draws next
uncovered lesson slice (grammar via new-item intro path, vocab via matchers), **forgiving
grading**: wrong answers write provisional entries (reuse D-021 provisional SRS semantics — never
demote an established item), always reveal with the Tatoeba example + gloss, copy frame "初めて —
first look. Guess." Capture session: current-week items, recall-format bias (stage-appropriate
ladder but nudged one format up), evening copy. Both end on the existing DayEndSummary with a
readiness delta line ("水曜日まで 74% → 82%"). e2e: with the date shim on a Tuesday, the seed task
appears and completes; on a Thursday, capture appears.

Commits: `Class week engine — seed/capture phases in the day plan (D-035 pt 1)` ·
`Seed & capture sessions — pretesting and consolidation, gently graded (D-035 pt 2)`

### Batch 3 — D-036 · Worksheets — grammar production (2 slices)

**Slice A — engine.** In `src/review/` (pure, tested): `clozeFor(grammarPoint, sentence)` — blank
the pattern occurrence (longest `patterns[]` match) from a real Tatoeba example, answer = the
removed substring, compare kana-tolerant via wanakana (accept kana⇄kanji-reading equivalence);
`transformFor(point, sentence)` — prompt shows the sentence's lemma + point name, answer = the
inflected pattern substring as it appears in the real sentence. Both return null when no clean
match (engine skips, never fabricates). Extend `MODES_BY_KIND`/`retrievalModeFor`: grammar gains
stage≥4 mode `'cloze'`, stage≥6 `'transform'`. SRS: grammar items additionally track
`productionStreak` (successful spaced production sessions on distinct days); ≥3 ⇒ **solid**
(Serfaty & Serrano rule) — surface as the Classroom status chip.
**Slice B — UI.** `WorksheetCard` in `cards.tsx` + styles: genkōyōshi-grid paper, the blank as a
brush-underlined gap, typed input (existing typed-mode affordances), grading via maru/shake, the
full sentence + translation revealed after. Interleaving guard: production sessions mix the target
point with ≥1 confusable sibling (same lesson or same-family pattern — pick via patterns-prefix
overlap; hybrid rule from §2.2.4). e2e: a cloze round-trips with a correct typed answer.

Commits: `Cloze & transform engine — production from real sentences only (D-036 pt 1)` ·
`Worksheet cards — the red pen, on paper (D-036 pt 2)`

### Batch 4 — D-037 · 手書き — kanji tracing (2 slices)

**Slice A — TraceCanvas.** `src/ui/TraceCanvas.tsx`: SVG with the KanjiVG strokes as faint guides
(existing `kanjivgIds`/strokes data) + a pointer-events capture layer. Per stroke: on
pointerdown→move→up, sample the user polyline; validate against the guide stroke by start/end
proximity + direction + coarse shape (sampled via `getPointAtLength`). **The jsdom law extension
(record in D-037): all `getTotalLength`/`getPointAtLength` calls live inside pointer handlers or
a lazily-initialized ref — never at render/mount — so jsdom never reaches them.** Wrong stroke =
gentle shake + guide pulse; correct = the stroke inks in (DrawSVG under motion, instant under
reduced). Unit tests: render shape, reduced behavior, stroke-advance state machine (with injected
sampler — the geometry fn is a prop with a browser default, so tests inject a fake). Correctness
of real geometry is e2e's job.
**Slice B — the weekly sheet.** Classroom's kanji row opens `KanjiSheet`: the week's six as
trace cells (2×3, handout register per §3); per-kanji completion persists (journal entry kind
`'trace'` — reuse the append-only journal, no new store); completed sheet → vermillion stamp in a
term stamp row + a one-time small ceremony (hanko press, reduced-gated). StrokeViewer gains a
"練習 Practice" button when strokes exist. e2e: pointer-simulate one correct stroke on a seeded
kanji (chromium real geometry), assert ink + persistence across reload.

Commits: `TraceCanvas — stroke-order handwriting on the KanjiVG data (D-037 pt 1)` ·
`The weekly kanji sheet — six cells, one stamp (D-037 pt 2)`

### Batch 5 — D-038 · The return loop (2 slices)

**Slice A — rhythm data + ring.** `src/day/rhythm.ts` (pure): `activeDays(journal)` (distinct
local dates with any entry), `daysInJapan` (count of active days since first entry — install day
counts: endowed progress), `weekCells(now, journal, settings)` → 7 cells {kept, isClassDay,
isToday} with **class-day auto-kept when class mode is on** (attendance credit — endowed), weekly
goal fixed at 5/7 (forgiveness by design; not configurable this pass — fewer knobs, kinder
default), `keptWeeks(journal)`. **Never expose a raw overdue/backlog count in any UI**: audit
existing surfaces — the Today card's "N due · M new" stays (it's today's plan, not debt), but cap
what a lapsed return shows: if due > 2× daily cap, the plan builds a capped warm session and the
fineprint says only "Today is short on purpose." Add the amnesty rule to the load shaper: items
overdue >14 days re-spread across the following week instead of stacking. All golden-tested.
**Slice B — surfaces + ceremonies.** Home header strip under the hero: the week ring + "日本で
N日目 — Day N in Japan" in the established quiet register. Readiness dial animates (brush arc,
DrawSVG draw-in on value change; reduced = static). Class-eve glow at ≥85% + one warm line.
**Lesson hanko ceremony**: all points solid ⇒ full-screen set-piece (letterbox + revealChars +
hankoPop, ≤2.4s, tap-skip, once per lesson via localStorage, never under reduced — exact D-033
arrival laws). Welcome-back state: lapse >3 days ⇒ おかえり copy + capped session (from Slice A).
Next-lesson seed gate: seeding lesson N+1 unlocks at lesson-N readiness ≥70% (mastery-gated
get-ahead; WaniKani rule). e2e: ring renders 7 cells; reduced project asserts no ceremony mounts.

Commits: `The rhythm layer — days lived, kept weeks, kind returns (D-038 pt 1)` ·
`Rings, dials, ceremonies — the return loop made visible (D-038 pt 2)`

### Batch 6 — D-039 · Cohesion + ship (1 slice)

- `e2e/classroom.spec.ts`: full journey — enable class mode → Tuesday seed (date shim) → answer →
  readiness moves → Thursday capture → worksheet cloze → trace one stroke → ring reflects the
  week; reduced project: no ceremonies, no dial animation, everything operable.
- `docs/decisions.md`: D-034…D-039 entries (each: what shipped, the evidence citations that drove
  it, the licensing method for D-034, the jsdom-law extension for D-037, the rejected mechanics
  list for D-038). Update About (class mode disclosure + the Quartet non-affiliation line:
  "Not affiliated with or endorsed by The Japan Times; no textbook content is reproduced.").
- Bundle + precache audit vs D-033 baseline (478KB min, 21→22 entries expected); three-scheme
  manual walkthrough with screenshots; push; CI green; live sw.js hash check; deliver the live
  link to the owner.

Commit: `Classroom companion — cohesion pass, D-034…D-039, e2e (D-039)`

---

## 6. Sequencing notes & risks

- **Batch order is dependency order** (classbook → rhythm → worksheets → tracing → loop). If a
  batch must be cut for time, cut from the end — Batches 1–2 alone already deliver "get ahead of
  class."
- The learner's term advances weekly — the app must never depend on *this* term's dates. All
  positioning is the two steppers (lesson, week) + class day; the seed pointer follows them.
- TraceCanvas is the riskiest slice (geometry, pointer events, e2e). The injected-sampler design
  keeps unit tests honest without jsdom geometry; if per-stroke shape matching proves fragile at
  walkthrough, degrade to start/end+direction only — record the call in D-037.
- Grammar authoring volume (~35–40 points) is the longest content task; batch it with the
  Tatoeba-coverage check early in Slice 1A so weak patterns are caught before the UI work.
- If `pipeline:validate` reveals the L3 pool lacks theme vocab for some lesson, widen matchers to
  L2/L4 pools before considering any other source.

*Written 2026-07-24. Supersedes docs/roadmap.md (all five of its batches + D-032/D-033 shipped).
Evidence: three cited research passes summarized in §2; full reports in the session transcript.*
