import type { KanjiItem, Level, VocabItem } from '@hikkoshi/schemas'
import type { Content } from '../content/packs'

/**
 * A recognition-testable candidate for the placement probe (D-021) — kanji or vocab only. Both
 * grade cleanly to a single meaning via `buildChoices`; grammar points and sentences don't fit a
 * quick recognition MC, so the probe (like E5's "kanji recognition → vocab → grammar" ordering,
 * trimmed to what an 8-question staircase can fairly sample) leaves them out.
 */
export type ProbeItem =
  | { id: string; kind: 'kanji'; item: KanjiItem }
  | { id: string; kind: 'vocab'; item: VocabItem }

/**
 * Recognition candidates for one difficulty band (a level), ordered easiest-first: kanji before
 * vocab (a single character is the quickest recognition check), and within kanji by KANJIDIC2
 * `grade` then frequency rank — both already on every kanji item — so the most common,
 * earliest-taught characters lead. The probe draws the first not-yet-used candidate for its
 * current band, so this ordering is what makes an early question at a band the fairest one.
 */
export function probeCandidates(content: Content, level: Level): ProbeItem[] {
  const kanji = content.kanji
    .filter((k) => k.level === level)
    .slice()
    .sort((a, b) => (a.grade ?? 99) - (b.grade ?? 99) || (a.freq ?? Number.MAX_SAFE_INTEGER) - (b.freq ?? Number.MAX_SAFE_INTEGER))
    .map<ProbeItem>((k) => ({ id: k.id, kind: 'kanji', item: k }))
  const vocab = content.vocab.filter((v) => v.level === level).map<ProbeItem>((v) => ({ id: v.id, kind: 'vocab', item: v }))
  return [...kanji, ...vocab]
}
