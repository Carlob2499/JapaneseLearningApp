import { useEffect, useMemo, useRef, useState } from 'react'
import type { ItemState, Outcome, PhraseTemplate, SceneTemplate, VocabItem } from '@hikkoshi/schemas'
import type { Content } from '../content/packs'
import { appendJournal, getAllItemStates, putItemState } from '../store/db'
import { applyReview, newState } from '../scheduler/srs'
import { buildChoices, buildPhraseChoices, buildPools, type Choice } from '../review/choices'
import { buildSceneSteps, pickSlotItem, planBeat, type SceneStep } from './sceneRunner'

export type SceneMode = 'loading' | 'playing' | 'complete' | 'error'

export interface SceneSummaryEntry {
  outcome: Outcome
  /** Vocab beats (recognize/recall/produce/speed) — the drilled item. */
  item?: VocabItem
  /** Context beats — the cited service line the learner judged (phrases aren't SRS items). */
  phrase?: string
}

/**
 * The current beat's resolved, ready-to-render interaction (Phase 4 / D-020). Discriminated on
 * `render`, mirroring `planBeat`'s three surfaces:
 *  - `mc`     — multiple choice over a vocab item (recognition/production; `timed` for speed).
 *  - `typed`  — type the item's reading (produce).
 *  - `phrase` — pick the cited service line that fits the situation (context) — no vocab item.
 */
export type ResolvedBeat =
  | { render: 'mc'; item: VocabItem; gloss: string; mode: 'recognition' | 'production'; timed: boolean; choices: Choice[] }
  | { render: 'typed'; item: VocabItem; gloss: string; answer: string }
  | { render: 'phrase'; correctPattern: string; choices: Choice[] }

export interface SceneApi {
  mode: SceneMode
  error: string | null
  step: SceneStep | null
  stepIndex: number
  totalSteps: number
  /** The resolved interaction for the current beat step (null for a narration step). */
  beat: ResolvedBeat | null
  /** The cited NPC line for the current step, if it has one. */
  phrase: PhraseTemplate | null
  summary: SceneSummaryEntry[]
  /** Advance past a narration step. */
  advance: () => void
  /** Grade the current beat step (the UI determines pass/fail from the interaction). */
  grade: (outcome: Outcome) => void
}

/** Runs one scene: resolves each beat's item slot from due/known vocab (or, for a `context`
 *  beat, its choices from the scene's cited phrases), grades vocab beats through the same SRS
 *  path as the flashcard review (`applyReview`/`putItemState`/`appendJournal`, tagging
 *  `sceneId`), and never repeats an item within the same run. */
export function useScene(scene: SceneTemplate, content: Content): SceneApi {
  const [mode, setMode] = useState<SceneMode>('loading')
  const [error, setError] = useState<string | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [summary, setSummary] = useState<SceneSummaryEntry[]>([])
  const [resolved, setResolved] = useState<ResolvedBeat | null>(null)

  const steps = useMemo(() => buildSceneSteps(scene), [scene])
  const pool = useMemo(
    () => content.vocab.filter((v) => v.modules.some((m) => scene.modules.includes(m))),
    [content, scene],
  )
  const pools = useMemo(() => buildPools(content), [content])
  const phraseById = useMemo(() => new Map(content.phrases.map((p) => [p.id, p])), [content])
  /** Verbatim cited service lines for this scene's modules — the context beat's answer space. */
  const modulePhrasePatterns = useMemo(
    () => content.phrases.filter((p) => scene.modules.includes(p.module)).map((p) => p.pattern),
    [content, scene],
  )

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

  // Resolve the current beat's interaction once per step (not on every re-render).
  useEffect(() => {
    if (mode !== 'playing' || !step || step.kind !== 'beat') {
      setResolved(null)
      return
    }
    // Context beat: discriminate cited service lines — no vocab item, no SRS slot.
    if (step.beat.interaction === 'context') {
      const correct = step.phraseId ? phraseById.get(step.phraseId) : undefined
      if (!correct) {
        setResolved(null)
        return
      }
      const choices = buildPhraseChoices(correct.pattern, modulePhrasePatterns)
      setResolved({ render: 'phrase', correctPattern: correct.pattern, choices })
      return
    }
    const item = pickSlotItem(pool, statesRef.current, usedRef.current, Date.now())
    if (!item) {
      setResolved(null)
      return
    }
    usedRef.current.add(item.id)
    const gloss = item.senses[0]?.gloss[0] ?? item.expression
    const plan = planBeat(step.beat.interaction, item)
    if (plan.render === 'typed') {
      setResolved({ render: 'typed', item, gloss, answer: plan.answer })
    } else {
      const choices = buildChoices({ id: item.id, kind: 'vocab', item }, plan.mode, pools)
      setResolved({ render: 'mc', item, gloss, mode: plan.mode, timed: plan.timed, choices })
    }
  }, [mode, step, pool, pools, phraseById, modulePhrasePatterns])

  function advance() {
    if (stepIndex + 1 >= steps.length) setMode('complete')
    else setStepIndex((i) => i + 1)
  }

  function grade(outcome: Outcome) {
    if (!resolved || !step || step.kind !== 'beat') return
    const now = Date.now()
    // Context (phrase) beat: log against the cited line; phrases aren't SRS-scheduled, so no
    // putItemState — mirrors how the Diary logs a context read without touching item state.
    if (resolved.render === 'phrase') {
      void appendJournal({ itemId: step.phraseId ?? scene.id, ts: now, interaction: 'context', outcome, sceneId: scene.id })
      setSummary((s) => [...s, { outcome, phrase: resolved.correctPattern }])
      advance()
      return
    }
    const item = resolved.item
    const prev = statesRef.current.get(item.id) ?? newState(item.id, now)
    const next = applyReview(prev, outcome, now)
    statesRef.current.set(item.id, next)
    void putItemState(next)
    void appendJournal({ itemId: item.id, ts: now, interaction: step.beat.interaction, outcome, sceneId: scene.id })
    setSummary((s) => [...s, { outcome, item }])
    advance()
  }

  return {
    mode,
    error,
    step,
    stepIndex,
    totalSteps: steps.length,
    beat: resolved,
    phrase: step?.phraseId ? (phraseById.get(step.phraseId) ?? null) : null,
    summary,
    advance,
    grade,
  }
}
