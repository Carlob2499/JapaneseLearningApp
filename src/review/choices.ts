import type { RetrievalMode } from '@hikkoshi/schemas'
import type { Content } from '../content/packs'
import type { Reviewable } from './useReview'

/** A single multiple-choice option. `text` is verbatim dataset content (D-002). */
export interface Choice {
  text: string
  correct: boolean
}

/** The kinds a card can be — kept in sync with the review queue's discriminant. */
export type CardKind = Reviewable['kind']

/** Random source in [0, 1). Injected so tests are deterministic; defaults to Math.random. */
export type Rng = () => number

/**
 * Distractor pools: verbatim strings harvested from every L1 item, one bag per answer
 * space. Every option shown to the user — correct answer and distractors alike — comes
 * from here, so nothing is generated (D-002).
 */
export interface Pools {
  /** Primary English gloss of each vocab item. */
  vocabGloss: string[]
  /** The Japanese headword of each vocab item. */
  vocabWord: string[]
  /** Primary English meaning of each kanji. */
  kanjiMeaning: string[]
  /** The kanji characters. */
  kanjiLiteral: string[]
  /** Hepburn romaji of each kana (D-023). */
  kanaRomaji: string[]
  /** Short function gloss of each grammar point. */
  grammarGloss: string[]
  /** English translation of each sentence. */
  sentenceEn: string[]
}

/** Harvest the distractor pools once from loaded content. */
export function buildPools(content: Content): Pools {
  return {
    vocabGloss: content.vocab
      .map((v) => v.senses[0]?.gloss[0])
      .filter((s): s is string => typeof s === 'string' && s.length > 0),
    vocabWord: content.vocab.map((v) => v.expression),
    kanjiMeaning: content.kanji.map((k) => k.meanings[0]),
    kanjiLiteral: content.kanji.map((k) => k.literal),
    kanaRomaji: content.kana.map((k) => k.romaji),
    grammarGloss: content.grammar.map((g) => g.gloss),
    sentenceEn: content.sentences.map((s) => s.en),
  }
}

/** Retrieval modes available per kind, easiest → hardest — the leech variety cycle draws from here. */
const MODES_BY_KIND: Record<CardKind, RetrievalMode[]> = {
  vocab: ['recognition', 'production', 'typed', 'recall'],
  kanji: ['recognition', 'production', 'recall'],
  kana: ['recognition', 'typed', 'recall'],
  grammar: ['recognition', 'recall'],
  sentence: ['recognition', 'recall'],
}

/**
 * Retrieval mode for a card, escalating with mastery: recognition (stage 0–1) → production
 * (2–3) → typed reading (4–5, vocab only) → free recall (6+). Kanji have no unambiguous typed
 * answer (multiple on/kun readings) so they go straight to recall at 4+; sentences and grammar
 * points have no production/typed form and stay recognition until recall at 4+. Kana (D-023)
 * skip production MC and go recognition → typed romaji (2–5) → recall — typing the sound IS
 * their production. A leech (architecture §5) is forced into varied modes — cycling by `seed` —
 * rather than hammering the same failing drill.
 */
export function retrievalModeFor(
  kind: CardKind,
  stage: number,
  opts: { leech?: boolean; seed?: number } = {},
): RetrievalMode {
  if (opts.leech) {
    const modes = MODES_BY_KIND[kind]
    return modes[(((opts.seed ?? 0) % modes.length) + modes.length) % modes.length]
  }
  if (stage <= 1) return 'recognition'
  if (kind === 'kana') return stage <= 5 ? 'typed' : 'recall'
  if (stage <= 3) return kind === 'sentence' || kind === 'grammar' ? 'recognition' : 'production'
  if (kind === 'vocab' && stage <= 5) return 'typed'
  return 'recall'
}

/** Fold display variants together for de-duping: case-fold and drop a trailing "(qualifier)". */
function normalize(s: string): string {
  return s.toLowerCase().replace(/\s*\([^)]*\)\s*/g, ' ').trim()
}

/** Fisher–Yates on a copy, using the injected rng. */
function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Draw up to `n` pool entries whose normalized form is new and not excluded. */
function sampleDistinct(pool: string[], n: number, exclude: Set<string>, rng: Rng): string[] {
  const seen = new Set(exclude)
  const out: string[] = []
  for (const s of shuffle(pool, rng)) {
    if (out.length >= n) break
    const key = normalize(s)
    if (key.length === 0 || seen.has(key)) continue
    seen.add(key)
    out.push(s)
  }
  return out
}

interface AnswerSpec {
  answer: string
  pool: string[]
  /** Normalized forms that may never appear as a distractor (the item's own answers). */
  exclude: Set<string>
}

/** What counts as the correct answer, and which pool the distractors come from. */
function answerSpec(r: Reviewable, mode: RetrievalMode, pools: Pools): AnswerSpec {
  if (r.kind === 'vocab') {
    if (mode === 'production') {
      return {
        answer: r.item.expression,
        pool: pools.vocabWord,
        exclude: new Set([normalize(r.item.expression)]),
      }
    }
    const answer = r.item.senses[0]?.gloss[0] ?? r.item.expression
    const own = r.item.senses.flatMap((s) => s.gloss).map(normalize)
    return { answer, pool: pools.vocabGloss, exclude: new Set([normalize(answer), ...own]) }
  }
  if (r.kind === 'kanji') {
    if (mode === 'production') {
      return {
        answer: r.item.literal,
        pool: pools.kanjiLiteral,
        exclude: new Set([normalize(r.item.literal)]),
      }
    }
    const answer = r.item.meanings[0]
    const own = r.item.meanings.map(normalize)
    return { answer, pool: pools.kanjiMeaning, exclude: new Set([normalize(answer), ...own]) }
  }
  if (r.kind === 'kana') {
    // recognition: the character cues its romaji sound; distractors are other kana readings.
    // The item's alternates are excluded too so a distractor can never also be correct.
    const own = [r.item.romaji, ...(r.item.altRomaji ?? [])].map(normalize)
    return { answer: r.item.romaji, pool: pools.kanaRomaji, exclude: new Set(own) }
  }
  if (r.kind === 'grammar') {
    // recognition only: identify the point's function; distractors are other grammar glosses
    return { answer: r.item.gloss, pool: pools.grammarGloss, exclude: new Set([normalize(r.item.gloss)]) }
  }
  // sentence — recognition only (production falls back upstream)
  return { answer: r.item.en, pool: pools.sentenceEn, exclude: new Set([normalize(r.item.en)]) }
}

export interface ChoiceOptions {
  count?: number
  rng?: Rng
}

/**
 * Build a shuffled multiple-choice set for a card: the correct answer plus up to `count-1`
 * dataset-sourced distractors, none matching the item's own answers. If a pool is somehow
 * too thin the result simply has fewer options — the UI copes.
 */
export function buildChoices(
  r: Reviewable,
  mode: RetrievalMode,
  pools: Pools,
  { count = 4, rng = Math.random }: ChoiceOptions = {},
): Choice[] {
  const spec = answerSpec(r, mode, pools)
  const exclude = new Set(spec.exclude)
  exclude.add(normalize(spec.answer))
  const distractors = sampleDistinct(spec.pool, count - 1, exclude, rng)
  const choices: Choice[] = [
    { text: spec.answer, correct: true },
    ...distractors.map((text) => ({ text, correct: false })),
  ]
  return shuffle(choices, rng)
}

/**
 * Build a shuffled choice set for a scene `context` beat (Phase 4 / D-020): the correct cited
 * service line plus up to `count-1` distractors drawn from `pool` — a list of *other* verbatim
 * cited phrase patterns from the scene's modules. Every option is real cited content (D-002);
 * the learner discriminates which line fits the situation, not which word means what. Distinct
 * from `buildChoices` (which drills a vocab/kanji/etc. item): here the answer space *is* the
 * phrase inventory, so it takes bare strings rather than a `Reviewable`.
 */
export function buildPhraseChoices(
  correctPattern: string,
  pool: string[],
  { count = 4, rng = Math.random }: ChoiceOptions = {},
): Choice[] {
  const exclude = new Set([normalize(correctPattern)])
  const distractors = sampleDistinct(pool, count - 1, exclude, rng)
  const choices: Choice[] = [
    { text: correctPattern, correct: true },
    ...distractors.map((text) => ({ text, correct: false })),
  ]
  return shuffle(choices, rng)
}
