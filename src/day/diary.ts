import type { JournalEntry } from '@hikkoshi/schemas'
import type { Content } from '../content/packs'
import { dayIndex } from '../scheduler/loadShaper'

/** Max reading-pass rows shown at once — a light end-of-day glance, not a study screen. */
export const DIARY_MAX_ENTRIES = 5

export interface DiaryEntry {
  itemId: string
  expression: string
  gloss: string
  sentenceId: string
  ja: string
  en: string
}

/**
 * A genuine, capped reading pass over today's distinct vocab (D-018 decision 5): for each
 * vocab id reviewed today (via any path — scene or plain flashcard, deduped to one entry
 * each), find the first already-loaded sentence whose `.ja` contains that vocab's
 * `.expression` (the same substring technique `pipeline/src/grammar.ts`'s `linkExamples`
 * uses server-side, now client-side). An item with no matching sentence is skipped —
 * never fabricated — and skipping it does not consume the cap. Candidate order is
 * defensively re-sorted by itemId rather than trusting the journal's (store) iteration
 * order, so the result is stable regardless of how the caller's IndexedDB read happened
 * to come back.
 */
export function pickDiaryEntries(
  content: Content,
  journal: JournalEntry[],
  now: number,
  cap = DIARY_MAX_ENTRIES,
): DiaryEntry[] {
  const today = dayIndex(now)
  const seen = new Set<string>()
  const candidateIds: string[] = []
  for (const e of journal) {
    if (dayIndex(e.ts) !== today) continue
    if (seen.has(e.itemId)) continue
    seen.add(e.itemId)
    candidateIds.push(e.itemId)
  }
  candidateIds.sort()

  const vocabById = new Map(content.vocab.map((v) => [v.id, v]))
  const entries: DiaryEntry[] = []
  for (const id of candidateIds) {
    if (entries.length >= cap) break
    const vocab = vocabById.get(id)
    if (!vocab) continue // reviewed today but not a vocab item (kanji/grammar/sentence) — skip
    const sentence = content.sentences.find((s) => s.ja.includes(vocab.expression))
    if (!sentence) continue // no example to read it in yet — skip, never fabricate
    entries.push({
      itemId: vocab.id,
      expression: vocab.expression,
      gloss: vocab.senses[0]?.gloss[0] ?? vocab.expression,
      sentenceId: sentence.id,
      ja: sentence.ja,
      en: sentence.en,
    })
  }
  return entries
}
