// Small, pure helpers for the shell. Kept dependency-free so they are trivially testable.
import type { Level } from '@hikkoshi/schemas'
import type { Content } from '../content/packs'
import manifest from '../../content/packs/manifest.json'

export const APP_NAME = 'Hikkoshi'
export const APP_NAME_JA = '引っ越し'

/** Total dataset-verified items across all committed content packs. */
export function packItemCount(): number {
  return manifest.packs.reduce((sum, p) => sum + p.itemCount, 0)
}

/** Domains a learner actually studies — what the level picker's counts should mean. Strokes
 *  join onto kanji/kana (not studied separately) and phrase/scene aren't graded directly. */
const STUDYABLE_DOMAINS = new Set(['vocab', 'kanji', 'kana', 'grammar', 'sentence'])

/** Studyable item count for one level — the honest number behind a level chip (D-023: without
 *  this, L0 would double-count its stroke pack and read 284 instead of 142). */
export function levelItemCount(level: Level): number {
  return manifest.packs
    .filter((p) => p.level === level && STUDYABLE_DOMAINS.has(p.domain))
    .reduce((sum, p) => sum + p.itemCount, 0)
}

/**
 * Ids of the "reviewable" pool for one level in already-loaded content — the exact kinds
 * `useReview.ts`'s `buildPool` draws `ItemState`s for (kana/vocab/kanji/grammar/sentence; strokes
 * join onto kanji and kana rather than getting their own state, and phrase/scene are never graded
 * directly). Note `SentenceItem` levels by `levelEstimate`, unlike every other domain's `level`
 * field — missing this silently undercounts a level's pool by its sentence share.
 */
export function reviewablePoolIds(content: Content, level: Level): string[] {
  const ids: string[] = []
  for (const kn of content.kana) if (kn.level === level) ids.push(kn.id)
  for (const v of content.vocab) if (v.level === level) ids.push(v.id)
  for (const k of content.kanji) if (k.level === level) ids.push(k.id)
  for (const g of content.grammar) if (g.level === level) ids.push(g.id)
  for (const s of content.sentences) if (s.levelEstimate === level) ids.push(s.id)
  return ids
}

/** Count form of `reviewablePoolIds` — the denominator for a level's coverage ratio. */
export function reviewablePoolCount(content: Content, level: Level): number {
  return reviewablePoolIds(content, level).length
}

/** JLPT label for each internal level (L1≈N5 … L5≈N1); levels are community estimates (D-005). */
export const JLPT_LABEL: Record<Level, string> = {
  L0: 'Kana',
  L1: 'N5',
  L2: 'N4',
  L3: 'N3',
  L4: 'N2',
  L5: 'N1',
}
