import { isHiragana } from 'wanakana'
import type { Beat, ItemState, SceneTemplate, VocabItem } from '@hikkoshi/schemas'

/** One step in the flattened scene sequence — either ambient narration or an interactive beat. */
export type SceneStep =
  | { kind: 'narration'; text: string; phraseId?: string }
  | { kind: 'beat'; text: string; phraseId?: string; beat: Beat }

/**
 * How a *vocab-item* beat renders, once its interaction and resolved item are known (Phase 4 /
 * D-020). Four of the five `Beat.interaction` values plan here:
 *  - `mc`     — multiple choice (recognition = JP cue → meaning; production = meaning cue → JP
 *              word). `timed` is set for the `speed` stage.
 *  - `typed`  — type the resolved item's reading (the `produce` stage), reusing the wanakana
 *              pipeline. `answer` is the verified reading.
 * The fifth value, `context`, plans separately against the scene's cited-phrase inventory (not a
 * vocab item) and so is excluded from `planBeat` and this type — see `useScene`.
 */
export type BeatPlan =
  | { render: 'mc'; mode: 'recognition' | 'production'; timed: boolean }
  | { render: 'typed'; answer: string }

/**
 * Decide how a vocab-item beat renders. `context` never reaches here — it resolves against the
 * phrase inventory, not a vocab item (see `useScene`). The `produce` stage falls back to a
 * production MC when the reading isn't clean hiragana (katakana loanwords make romaji long-vowel
 * input too fiddly — the exact guard the flashcard `typed` mode already applies, D-013).
 */
export function planBeat(interaction: Exclude<Beat['interaction'], 'context'>, item: VocabItem): BeatPlan {
  switch (interaction) {
    case 'recognize':
      return { render: 'mc', mode: 'recognition', timed: false }
    case 'recall':
      return { render: 'mc', mode: 'production', timed: false }
    case 'speed':
      return { render: 'mc', mode: 'recognition', timed: true }
    case 'produce':
      return isHiragana(item.reading)
        ? { render: 'typed', answer: item.reading }
        : { render: 'mc', mode: 'production', timed: false }
  }
}

/**
 * Flatten a scene's `framing` (an ordered array of narration/dialogue lines) into a linear
 * step sequence, splicing in the referenced `Beat` wherever a framing entry names one via
 * `beatId`. This is the scene's whole "script" — the SceneRunner just walks it in order.
 */
export function buildSceneSteps(scene: SceneTemplate): SceneStep[] {
  const beatsById = new Map(scene.beats.map((b) => [b.id, b]))
  return scene.framing.map((f) => {
    const beat = f.beatId ? beatsById.get(f.beatId) : undefined
    if (beat) return { kind: 'beat', text: f.text, phraseId: f.phraseId, beat }
    return { kind: 'narration', text: f.text, phraseId: f.phraseId }
  })
}

export type Rng = () => number

/**
 * Resolve one beat's item slot to a concrete vocab item from the scene's module pool
 * (curriculum §5 P1/P3 — the SRS decides *what* is due, the scene decides *where* it
 * resurfaces): a due item first (earliest due), else a known item (has state, not yet due —
 * picked at random for freshness across replays), else introduce a fresh item from the pool.
 * Never repeats an item already used earlier in the same scene run.
 */
export function pickSlotItem(
  pool: VocabItem[],
  states: Map<string, ItemState>,
  usedIds: Set<string>,
  now: number,
  rng: Rng = Math.random,
): VocabItem | undefined {
  const candidates = pool.filter((v) => !usedIds.has(v.id))
  if (candidates.length === 0) return undefined

  const due = candidates
    .filter((v) => {
      const st = states.get(v.id)
      return st !== undefined && st.due <= now
    })
    .sort((a, b) => (states.get(a.id)?.due ?? 0) - (states.get(b.id)?.due ?? 0))
  if (due.length > 0) return due[0]

  const known = candidates.filter((v) => states.has(v.id))
  if (known.length > 0) return known[Math.floor(rng() * known.length)]

  return candidates[0]
}
