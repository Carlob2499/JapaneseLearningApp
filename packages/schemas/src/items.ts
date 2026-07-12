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

/** Grammar point — curated, each with ≥1 citation (D-005). Defined now; populated later. */
export const GrammarPoint = z.object({
  kind: z.literal('grammar'),
  id: z.string().min(1),
  name: z.string().min(1),
  level: Level,
  summary: z.string().min(1),
  citations: z.array(Source).min(1),
  textbookAnchors: z
    .array(z.object({ book: z.string().min(1), chapter: z.number().int() }))
    .optional(),
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
  coverage: z.object({ knownRatioBasis: z.string().min(1) }),
})
export type SentenceItem = z.infer<typeof SentenceItem>

/** Kanji stroke-order data — from KanjiVG, ordered SVG path strings on a 109×109 canvas. */
export const StrokeItem = z.object({
  kind: z.literal('strokes'),
  id: z.string().min(1),
  literal: z.string().min(1),
  kanjivgId: z.string().min(1),
  viewBox: z.string().min(1),
  strokes: z.array(z.string().min(1)).min(1),
  strokeCount: z.number().int().positive(),
})
export type StrokeItem = z.infer<typeof StrokeItem>

/** Scene phrase template — curated register facts, cited. Defined now; populated later. */
export const PhraseTemplate = z.object({
  kind: z.literal('phrase'),
  id: z.string().min(1),
  module: ModuleTag,
  register: Register,
  pattern: z.string().min(1),
  citations: z.array(Source).min(1),
})
export type PhraseTemplate = z.infer<typeof PhraseTemplate>

/** Any pack item, discriminated on `kind`. */
export const Item = z.discriminatedUnion('kind', [
  VocabItem,
  KanjiItem,
  GrammarPoint,
  SentenceItem,
  StrokeItem,
  PhraseTemplate,
])
export type Item = z.infer<typeof Item>
