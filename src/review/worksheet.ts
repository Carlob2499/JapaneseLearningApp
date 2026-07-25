import { isHiragana } from 'wanakana'
import type { GrammarPoint } from '@hikkoshi/schemas'

/** A grammar point decomposed around its pattern in one real example sentence (D-036). Never
 *  assembled text: `before`/`blank`/`after` concatenate back to the verbatim Tatoeba sentence
 *  (D-002) — the same example the point already ships, just split at the pattern's own span. */
export interface ClozePrompt {
  before: string
  blank: string
  after: string
  translationEn: string
}

/**
 * Find the point's own pattern inside one of its own examples (both already dataset-verified —
 * this only locates the substring, never invents one) and split around it. Prefers the longest
 * matching pattern (more specific, less likely to also match a shorter unrelated substring) and
 * the example where it appears earliest, for a stable, deterministic prompt across renders.
 */
export function clozeFor(point: GrammarPoint): ClozePrompt | null {
  const byLength = [...point.patterns].sort((a, b) => b.length - a.length)
  for (const ex of point.examples) {
    const pattern = byLength.find((p) => ex.ja.includes(p))
    if (!pattern) continue
    const idx = ex.ja.indexOf(pattern)
    return {
      before: ex.ja.slice(0, idx),
      blank: pattern,
      after: ex.ja.slice(idx + pattern.length),
      translationEn: ex.en,
    }
  }
  return null
}

/** Whether a cloze prompt's blank is typeable without an IME (D-036, same rule TypedCard already
 *  applies to kanji-containing vocab readings) — a kanji-bearing pattern falls back to recall. */
export function clozeIsTypeable(prompt: ClozePrompt): boolean {
  return isHiragana(prompt.blank)
}

/**
 * Other grammar points sharing a pattern-prefix family with `target` (D-036 hybrid interleaving
 * guard, §2.2.4 — Pan et al. 2019; Nakata & Suzuki 2019: never quiz a point only inside its own
 * bucket). The prefix-overlap rule needs no hand-authored taxonomy, so it stays inside the
 * dataset-only rule (D-002): two patterns sharing their first two characters is a real lexical
 * signal for the actual content (ませ/まし, てく, から...), not an invented grouping.
 */
export function confusableSiblings(target: GrammarPoint, pool: readonly GrammarPoint[]): GrammarPoint[] {
  const targetPrefixes = new Set(target.patterns.map((p) => p.slice(0, 2)))
  return pool.filter((g) => g.id !== target.id && g.patterns.some((p) => targetPrefixes.has(p.slice(0, 2))))
}
