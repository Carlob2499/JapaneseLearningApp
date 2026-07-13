import { useEffect, useMemo, useRef, useState } from 'react'
import type { Beat, ItemState, Outcome, PhraseTemplate, SceneTemplate, VocabItem } from '@hikkoshi/schemas'
import type { Content } from '../content/packs'
import { appendJournal, getAllItemStates, putItemState } from '../store/db'
import { applyReview, newState } from '../scheduler/srs'
import { buildChoices, buildPools, type Choice } from '../review/choices'
import { buildSceneSteps, pickSlotItem, type SceneStep } from './sceneRunner'

export type SceneMode = 'loading' | 'playing' | 'complete' | 'error'

export interface SceneSummaryEntry {
  item: VocabItem
  outcome: Outcome
}

export interface SceneApi {
  mode: SceneMode
  error: string | null
  step: SceneStep | null
  stepIndex: number
  totalSteps: number
  /** The item resolved for the current beat step (null for a narration step). */
  item: VocabItem | null
  /** The cited NPC line for the current step, if it has one. */
  phrase: PhraseTemplate | null
  /** MC choices for the current beat step. */
  choices: Choice[] | null
  summary: SceneSummaryEntry[]
  /** Advance past a narration step. */
  advance: () => void
  /** Grade the current beat step (the UI determines pass/fail from the picked Choice). */
  grade: (outcome: Outcome) => void
}

/**
 * Beat.interaction is a scene-specific vocabulary (architecture §4), deliberately distinct
 * from the flashcard `RetrievalMode`: `recognize` cues with the Japanese and asks for the
 * meaning (→ `recognition`); `recall` shows only the meaning and asks for the Japanese,
 * uncued (→ `production`, the closest existing harder mode — a dedicated typed/produce
 * beat is Phase 4).
 */
function modeFor(interaction: Beat['interaction']): 'recognition' | 'production' {
  return interaction === 'recognize' ? 'recognition' : 'production'
}

/** Runs one scene: resolves each beat's item slot from due/known vocab, grades through the
 *  same SRS path as the flashcard review (`applyReview`/`putItemState`/`appendJournal`, now
 *  tagging `sceneId`), and never repeats an item within the same run. */
export function useScene(scene: SceneTemplate, content: Content): SceneApi {
  const [mode, setMode] = useState<SceneMode>('loading')
  const [error, setError] = useState<string | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [summary, setSummary] = useState<SceneSummaryEntry[]>([])
  const [resolved, setResolved] = useState<{ item: VocabItem; choices: Choice[] } | null>(null)

  const steps = useMemo(() => buildSceneSteps(scene), [scene])
  const pool = useMemo(
    () => content.vocab.filter((v) => v.modules.some((m) => scene.modules.includes(m))),
    [content, scene],
  )
  const pools = useMemo(() => buildPools(content), [content])
  const phraseById = useMemo(() => new Map(content.phrases.map((p) => [p.id, p])), [content])

  const statesRef = useRef<Map<string, ItemState>>(new Map())
  const usedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const states = await getAllItemStates()
        if (!alive) return
        statesRef.current = new Map(states.map((s) => [s.itemId, s]))
        setMode(pool.length > 0 ? 'playing' : 'error')
        if (pool.length === 0) setError('No items available for this errand yet.')
      } catch (e) {
        if (!alive) return
        setError(e instanceof Error ? e.message : 'Could not load your progress.')
        setMode('error')
      }
    })()
    return () => {
      alive = false
    }
  }, [pool])

  const step = steps[stepIndex] ?? null

  // Resolve the current beat's item + choices once per step (not on every re-render).
  useEffect(() => {
    if (mode !== 'playing' || !step || step.kind !== 'beat') {
      setResolved(null)
      return
    }
    const item = pickSlotItem(pool, statesRef.current, usedRef.current, Date.now())
    if (!item) {
      setResolved(null)
      return
    }
    usedRef.current.add(item.id)
    const reviewable = { id: item.id, kind: 'vocab' as const, item }
    const choices = buildChoices(reviewable, modeFor(step.beat.interaction), pools)
    setResolved({ item, choices })
  }, [mode, step, pool, pools])

  function advance() {
    if (stepIndex + 1 >= steps.length) setMode('complete')
    else setStepIndex((i) => i + 1)
  }

  function grade(outcome: Outcome) {
    if (!resolved || !step || step.kind !== 'beat') return
    const now = Date.now()
    const prev = statesRef.current.get(resolved.item.id) ?? newState(resolved.item.id, now)
    const next = applyReview(prev, outcome, now)
    statesRef.current.set(resolved.item.id, next)
    void putItemState(next)
    void appendJournal({ itemId: resolved.item.id, ts: now, interaction: step.beat.interaction, outcome, sceneId: scene.id })
    setSummary((s) => [...s, { item: resolved.item, outcome }])
    advance()
  }

  return {
    mode,
    error,
    step,
    stepIndex,
    totalSteps: steps.length,
    item: resolved?.item ?? null,
    phrase: step?.phraseId ? (phraseById.get(step.phraseId) ?? null) : null,
    choices: resolved?.choices ?? null,
    summary,
    advance,
    grade,
  }
}
