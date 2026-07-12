import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isHiragana } from 'wanakana'
import type {
  ItemState,
  KanjiItem,
  Level,
  Outcome,
  RetrievalMode,
  SentenceItem,
  StrokeItem,
  VocabItem,
} from '@hikkoshi/schemas'
import { loadLevels, type Content } from '../content/packs'
import { appendJournal, getAllItemStates, getJournal, putItemState } from '../store/db'
import { applyReview, dueItems, isLeech, newState, pickNewItems } from '../scheduler/srs'
import { DEFAULT_DAILY_NEW, loadHistogram, shapeDueQueue, snapToLightestDay } from '../scheduler/loadShaper'
import { buildChoices, buildPools, retrievalModeFor, type Choice, type Pools } from './choices'

export type Reviewable =
  | { id: string; kind: 'vocab'; item: VocabItem }
  | { id: string; kind: 'kanji'; item: KanjiItem; stroke?: StrokeItem }
  | { id: string; kind: 'sentence'; item: SentenceItem }

/** What to show for the head-of-queue item: the item, its retrieval mode, and (for MC) the choices. */
export interface Presentation {
  reviewable: Reviewable
  mode: RetrievalMode
  choices?: Choice[]
}

export type Mode = 'loading' | 'review' | 'practice' | 'summary' | 'error'

const INTRO_CAP = DEFAULT_DAILY_NEW
const PRACTICE_SIZE = 24

/** Round-robin kanji/vocab/sentence so a fresh session's intro batch is varied (kanji first). */
function buildPool(c: Content): Reviewable[] {
  const kanji = c.kanji.map<Reviewable>((k) => ({
    id: k.id,
    kind: 'kanji',
    item: k,
    stroke: c.strokesById.get(k.strokes.kanjivgId),
  }))
  const vocab = c.vocab.map<Reviewable>((v) => ({ id: v.id, kind: 'vocab', item: v }))
  const sentence = c.sentences.map<Reviewable>((s) => ({ id: s.id, kind: 'sentence', item: s }))
  const out: Reviewable[] = []
  const max = Math.max(kanji.length, vocab.length, sentence.length)
  for (let i = 0; i < max; i++) {
    if (kanji[i]) out.push(kanji[i])
    if (vocab[i]) out.push(vocab[i])
    if (sentence[i]) out.push(sentence[i])
  }
  return out
}

/**
 * Retrieval mode for an item (leech-aware), with one runtime guard the pure selector can't make:
 * typed reading only works when the reading is clean hiragana — katakana loanwords make romaji
 * long-vowel input too fiddly, so those fall back to free recall.
 */
function resolveMode(r: Reviewable, st: ItemState | undefined): RetrievalMode {
  const mode = retrievalModeFor(r.kind, st?.stage ?? 0, { leech: st?.leech, seed: st?.lapses })
  if (mode === 'typed' && r.kind === 'vocab' && !isHiragana(r.item.reading)) return 'recall'
  return mode
}

export interface ReviewApi {
  mode: Mode
  view: Presentation | null
  remaining: number
  reviewed: number
  sessionSize: number
  error: string | null
  grade: (outcome: Outcome) => void
  practiceMore: () => void
}

export function useReview(levels: Level[]): ReviewApi {
  const [mode, setMode] = useState<Mode>('loading')
  const [error, setError] = useState<string | null>(null)
  const [queue, setQueue] = useState<Reviewable[]>([])
  const [reviewed, setReviewed] = useState(0)
  const [sessionSize, setSessionSize] = useState(0)
  const poolRef = useRef<Reviewable[]>([])
  const byIdRef = useRef<Map<string, Reviewable>>(new Map())
  const statesRef = useRef<Map<string, ItemState>>(new Map())
  const poolsRef = useRef<Pools>({
    vocabGloss: [],
    vocabWord: [],
    kanjiMeaning: [],
    kanjiLiteral: [],
    sentenceEn: [],
  })
  const shownAtRef = useRef<number>(Date.now())
  const failTsRef = useRef<Map<string, number[]>>(new Map())

  useEffect(() => {
    let alive = true
    void (async () => {
      let content: Content
      try {
        content = await loadLevels(levels)
      } catch (e) {
        if (!alive) return
        setError(e instanceof Error ? e.message : 'Could not load content')
        setMode('error')
        return
      }
      const [states, journal] = await Promise.all([getAllItemStates(), getJournal()])
      if (!alive) return
      const pool = buildPool(content)
      poolRef.current = pool
      poolsRef.current = buildPools(content)
      byIdRef.current = new Map(pool.map((r) => [r.id, r]))
      statesRef.current = new Map(states.map((s) => [s.itemId, s]))

      // Fail history for leech detection (architecture §5), grouped per item.
      const failTs = new Map<string, number[]>()
      for (const e of journal) {
        if (e.outcome !== 'fail') continue
        const arr = failTs.get(e.itemId) ?? []
        arr.push(e.ts)
        failTs.set(e.itemId, arr)
      }
      failTsRef.current = failTs

      const now = Date.now()
      // Load-shape the due set: cap the session and slide the lowest-stakes overflow forward.
      const { keep, slide } = shapeDueQueue(dueItems(now, states), now)
      for (const s of slide) {
        statesRef.current.set(s.itemId, s)
        void putItemState(s)
      }
      const due = keep
        .map((s) => byIdRef.current.get(s.itemId))
        .filter((r): r is Reviewable => r !== undefined)

      const introIds = pickNewItems(
        pool.map((r) => r.id),
        states,
        INTRO_CAP,
      )
      for (const id of introIds) {
        const st = newState(id, Date.now())
        statesRef.current.set(id, st)
        void putItemState(st)
      }
      const intro = introIds
        .map((id) => byIdRef.current.get(id))
        .filter((r): r is Reviewable => r !== undefined)

      const session = [...due, ...intro]
      setQueue(session)
      setSessionSize(session.length)
      setMode(session.length > 0 ? 'review' : 'summary')
    })()
    return () => {
      alive = false
    }
  }, [levels])

  const grade = useCallback(
    (outcome: Outcome) => {
      setQueue((q) => {
        const cur = q[0]
        if (!cur) return q
        if (mode === 'review') {
          const now = Date.now()
          const prev = statesRef.current.get(cur.id) ?? newState(cur.id, now)
          // Log the mode the user actually saw — pre-review stage, leech- and reading-aware.
          const interaction = resolveMode(cur, prev)
          const latencyMs = Math.max(0, Math.round(now - shownAtRef.current))
          const next = applyReview(prev, outcome, now)
          // Track fail history and (re)flag leeches — 3 fails / 30 days (architecture §5).
          if (outcome === 'fail') {
            const arr = failTsRef.current.get(cur.id) ?? []
            arr.push(now)
            failTsRef.current.set(cur.id, arr)
          }
          next.leech = isLeech(failTsRef.current.get(cur.id) ?? [], now)
          // Anti-clumping: snap the next due to the lightest nearby day.
          next.due = snapToLightestDay(next.due, now, loadHistogram([...statesRef.current.values()], cur.id))
          statesRef.current.set(cur.id, next)
          void putItemState(next)
          void appendJournal({ itemId: cur.id, ts: now, interaction, outcome, latencyMs })
          setReviewed((r) => r + 1)
        }
        const rest = q.slice(1)
        if (rest.length === 0) setMode('summary')
        return rest
      })
    },
    [mode],
  )

  const practiceMore = useCallback(() => {
    const pool = poolRef.current
    if (pool.length === 0) return
    const shuffled = [...pool]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    const session = shuffled.slice(0, PRACTICE_SIZE)
    setReviewed(0)
    setSessionSize(session.length)
    setQueue(session)
    setMode('practice')
  }, [])

  const current = queue[0] ?? null

  // Presentation for the head item: mode by mastery, MC choices sourced from the pools.
  // Memoized per item so choices don't reshuffle on unrelated re-renders.
  const view = useMemo<Presentation | null>(() => {
    if (!current) return null
    const rmode = resolveMode(current, statesRef.current.get(current.id))
    // Recall and typed cards need no multiple-choice options.
    const choices =
      rmode === 'recall' || rmode === 'typed' ? undefined : buildChoices(current, rmode, poolsRef.current)
    return { reviewable: current, mode: rmode, choices }
  }, [current])

  // Reset the latency clock whenever a new card is shown.
  useEffect(() => {
    shownAtRef.current = Date.now()
  }, [current])

  return {
    mode,
    view,
    remaining: queue.length,
    reviewed,
    sessionSize,
    error,
    grade,
    practiceMore,
  }
}
