import { z } from 'zod'
import { Level, ModuleTag, Register, Source } from './common'

/** One dictionary sense: glosses + parts of speech (from JMdict). */
export const Sense = z.object({
  gloss: z.array(z.string().min(1)).min(1),
  pos: z.array(z.string()),
})
export type Sense = z.infer<typeof Sense>

/**
 * Vocabulary item. Membership + `level` come from the community JLPT list
 * (an estimate); `expression`/`reading`/`senses` are the dataset-verified
 * payload resolved from JMdict (D-002). `levelSpread` records disagreement
 * across tag sources (D-005).
 */
export const VocabItem = z.object({
  kind: z.literal('vocab'),
  id: z.string().min(1),
  jmdictSeq: z.number().int(),
  expression: z.string().min(1),
  reading: z.string().min(1),
  senses: z.array(Sense).min(1),
  level: Level,
  levelSpread: z.array(z.string()).optional(),
  modules: z.array(ModuleTag),
  audioHint: z.string().optional(),
})
export type VocabItem = z.infer<typeof VocabItem>

/**
 * Kanji item. `level` (jlpt_new estimate) + `strokes.kanjivgId` are join
 * outputs; readings/meanings/grade/freq/jlptOld are KANJIDIC2-verified.
 */
export const KanjiItem = z.object({
  kind: z.literal('kanji'),
  id: z.string().min(1),
  literal: z.string().min(1),
  level: Level,
  jlptOld: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
  grade: z.number().int().optional(),
  freq: z.number().int().optional(),
  strokes: z.object({ kanjivgId: z.string().min(1) }),
  readingsOn: z.array(z.string()),
  readingsKun: z.array(z.string()),
  meanings: z.array(z.string().min(1)).min(1),
  levelSpread: z.array(z.string()).optional(),
})
export type KanjiItem = z.infer<typeof KanjiItem>

/**
 * A verbatim Tatoeba sentence attached to a grammar point as an example (D-002:
 * examples are dataset-verified, never authored — only the point's own prose is written).
 */
export const GrammarExample = z.object({
  ja: z.string().min(1),
  en: z.string().min(1),
  tatoebaId: z.number().int(),
  attribution: z.object({
    author: z.string(),
    license: z.enum(['CC-BY-2.0-FR', 'CC0-1.0']),
  }),
})
export type GrammarExample = z.infer<typeof GrammarExample>

/**
 * Grammar point — curated (D-005). The `name` (pattern), short `gloss`, and fuller `summary`
 * are original prose (the D-005 exception: no importable open grammar inventory exists), each
 * with ≥1 `citation` cross-referencing public inventories and a textbook anchor. `examples`
 * are drawn verbatim from Tatoeba at build time (D-002) — every shipped point has ≥1. `patterns`
 * (the literal Japanese substrings used to find those examples) ship too, not just consumed at
 * build time — the worksheet engine (D-036) needs them at runtime to find which substring of a
 * real example sentence to blank for a cloze prompt.
 */
export const GrammarPoint = z.object({
  kind: z.literal('grammar'),
  id: z.string().min(1),
  name: z.string().min(1),
  level: Level,
  /** Short English function label, for MC options and compact display (e.g. "permission — it's OK to …"). */
  gloss: z.string().min(1),
  /** Fuller original-prose explanation shown on the recall card. */
  summary: z.string().min(1),
  citations: z.array(Source).min(1),
  textbookAnchors: z
    .array(z.object({ book: z.string().min(1), chapter: z.number().int() }))
    .optional(),
  examples: z.array(GrammarExample).min(1),
  patterns: z.array(z.string().min(1)).min(1),
})
export type GrammarPoint = z.infer<typeof GrammarPoint>

/** Example sentence — from Tatoeba, with per-sentence attribution. Defined now; populated later. */
export const SentenceItem = z.object({
  kind: z.literal('sentence'),
  id: z.string().min(1),
  tatoebaId: z.number().int(),
  ja: z.string().min(1),
  en: z.string().min(1),
  attribution: z.object({
    author: z.string(),
    license: z.enum(['CC-BY-2.0-FR', 'CC0-1.0']),
  }),
  levelEstimate: Level,
  /** Politeness register, estimated from the sentence's grammatical ending (heuristic, D-005). */
  register: Register,
  coverage: z.object({ knownRatioBasis: z.string().min(1) }),
})
export type SentenceItem = z.infer<typeof SentenceItem>

/**
 * One kana unit (D-023, extended for yōon in D-029) — the L0 foundation the rest of the app
 * assumes. The character and its stroke data are dataset-verified (KanjiVG, via the matching L0
 * strokes pack); the `romaji` reading follows the Hepburn romanization convention (cited at the
 * pack level), with `altRomaji` acceptance variants (shi/si, sha/sya, ja/zya…) so typed grading
 * never fails a correct learner. `row` is the gojūon row label (a, ka, sa…, ga… voiced, kya…
 * yōon) — packs emit in gojūon order so the intro budget introduces kana row-by-row (blocked
 * introduction, E3). `kanjivgIds` is one KanjiVG id per component glyph: a length-1 array for a
 * base kana, length-2 for a yōon compound (e.g. きゃ = き + ゃ), each joined to its own stroke
 * item so the card can show every component's stroke order.
 */
export const KanaItem = z.object({
  kind: z.literal('kana'),
  id: z.string().min(1),
  char: z.string().min(1),
  script: z.enum(['hiragana', 'katakana']),
  romaji: z.string().min(1),
  altRomaji: z.array(z.string().min(1)).optional(),
  row: z.string().min(1),
  kanjivgIds: z.array(z.string().min(1)).min(1),
  level: Level,
})
export type KanaItem = z.infer<typeof KanaItem>

/** Kanji stroke-order data — from KanjiVG, ordered SVG path strings on a 109×109 canvas. */
export const StrokeItem = z.object({
  kind: z.literal('strokes'),
  id: z.string().min(1),
  literal: z.string().min(1),
  level: Level,
  kanjivgId: z.string().min(1),
  viewBox: z.string().min(1),
  strokes: z.array(z.string().min(1)).min(1),
  strokeCount: z.number().int().positive(),
})
export type StrokeItem = z.infer<typeof StrokeItem>

/**
 * Scene phrase template — a fixed real-world service/register line, cited to the
 * documented-usage sources that motivate the module (curriculum.md §4). Never generated:
 * the Japanese `pattern` is copied verbatim from the cited guide/survey (D-002); only the
 * point of introduction (`level`) is our estimate.
 */
export const PhraseTemplate = z.object({
  kind: z.literal('phrase'),
  id: z.string().min(1),
  level: Level,
  module: ModuleTag,
  register: Register,
  pattern: z.string().min(1),
  /** English meaning + Hepburn romaji — supporting annotations for phrases shown *standalone* as a
   *  reference (the M9 emergency card, D-031), not the cited Japanese itself. Optional: scene NPC
   *  lines (M2/M3) don't need them (their English lives in the model-written scene framing). */
  gloss: z.string().min(1).optional(),
  romaji: z.string().min(1).optional(),
  citations: z.array(Source).min(1),
})
export type PhraseTemplate = z.infer<typeof PhraseTemplate>

/**
 * One interaction within a scene. `slotIds` are logical labels (not item ids) — the
 * SceneRunner resolves each to a concrete item drawn from the scene's module pool at
 * presentation time (due items first, then known items — curriculum §5 P1/P3), so the
 * same beat surfaces a different real item on every replay.
 */
export const Beat = z.object({
  id: z.string().min(1),
  interaction: z.enum(['recognize', 'recall', 'produce', 'speed', 'context']),
  slotIds: z.array(z.string().min(1)).min(1),
})
export type Beat = z.infer<typeof Beat>

/**
 * A curated real-world scene (D-002-safe): the item slots are resolved at runtime from
 * dataset-verified vocabulary tagged into the scene's modules; only the English `framing`
 * prose is model-written (curriculum §5, architecture §4). `beats` are the ordered
 * interactions. Each `framing` entry is one NPC-dialogue/narration beat: `phraseId`
 * (a cited `PhraseTemplate.id`) supplies the verbatim Japanese line, if any; `beatId`
 * pairs it with the interaction it precedes, or is omitted for pure narration.
 */
export const SceneTemplate = z.object({
  kind: z.literal('scene'),
  id: z.string().min(1),
  sceneKind: z.enum(['konbini', 'transit']),
  level: Level,
  modules: z.array(ModuleTag).min(1),
  /** Errand-tile title override (D-030); defaults to the sceneKind's generic title when absent —
   *  lets two scenes of the same kind (customer vs. clerk) read distinctly on Today. */
  title: z.string().min(1).optional(),
  /** Life-stage gate (D-030): the scene only surfaces as an errand once the learner reaches this
   *  stage (0 = Tourist … 5). Absent = always available. The behind-the-counter shift needs ≥ 2
   *  (Part-timer) — you get the job before you can work it. */
  minStage: z.number().int().min(0).max(5).optional(),
  beats: z.array(Beat).min(1),
  framing: z
    .array(
      z.object({
        beatId: z.string().min(1).optional(),
        phraseId: z.string().min(1).optional(),
        text: z.string().min(1),
        modelWritten: z.literal(true),
      }),
    )
    .min(1),
})
export type SceneTemplate = z.infer<typeof SceneTemplate>

/** Any pack item, discriminated on `kind`. */
export const Item = z.discriminatedUnion('kind', [
  VocabItem,
  KanjiItem,
  KanaItem,
  GrammarPoint,
  SentenceItem,
  StrokeItem,
  PhraseTemplate,
  SceneTemplate,
])
export type Item = z.infer<typeof Item>
