import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isHiragana } from 'wanakana'
import type {
  GrammarPoint,
  ItemState,
  JournalEntry,
  KanaItem,
  KanjiItem,
  Level,
  Outcome,
  RetrievalMode,
  SentenceItem,
  StrokeItem,
  VocabItem,
} from '@hikkoshi/schemas'
import { loadLevels, type Content } from '../content/packs'
import { hasJapaneseVoice } from '../audio/tts'
import { appendJournal, getAllItemStates, getJournal, putItemState } from '../store/db'
import { applyReview, dueItems, isLeech, LEECH_WINDOW_MS, newState, pickNewItems } from '../scheduler/srs'
import { ALL_LEVELS } from '../store/settings'
import {
  dayIndex,
  introBudget,
  loadHistogram,
  shapeDueQueue,
  snapToLightestDay,
} from '../scheduler/loadShaper'
import { buildChoices, buildPools, retrievalModeFor, type Choice, type Pools } from './choices'

export type Reviewable =
  | { id: string; kind: 'vocab'; item: VocabItem }
  | { id: string; kind: 'kanji'; item: KanjiItem; stroke?: StrokeItem }
  | { id: string; kind: 'kana'; item: KanaItem; strokes?: StrokeItem[] }
  | { id: string; kind: 'grammar'; item: GrammarPoint }
  | { id: string; kind: 'sentence'; item: SentenceItem }

/** What to show for the head-of-queue item: the item, its retrieval mode, and (for MC) the choices. */
export interface Presentation {
  reviewable: Reviewable
  mode: RetrievalMode
  choices?: Choice[]
}

export type Mode = 'loading' | 'review' | 'practice' | 'summary' | 'error'

const PRACTICE_SIZE = 24

/**
 * Kana first and BLOCKED (never interleaved — you can't read the other kinds without them,
 * and blocking beats interleaving for brand-new symbol sets, E3/D-023; their pack order is the
 * gojūon curriculum), then a round-robin of kanji/vocab/grammar/sentence so a fresh session's
 * intro batch is varied (kanji first).
 */
function buildPool(c: Content): Reviewable[] {
  const kana = c.kana.map<Reviewable>((k) => ({
    id: k.id,
    kind: 'kana',
    item: k,
    // A yōon joins two component strokes (base + small); a base kana joins one.
    strokes: k.kanjivgIds
      .map((id) => c.strokesById.get(id))
      .filter((s): s is StrokeItem => s !== undefined),
  }))
  const kanji = c.kanji.map<Reviewable>((k) => ({
    id: k.id,
    kind: 'kanji',
    item: k,
    stroke: c.strokesById.get(k.strokes.kanjivgId),
  }))
  const vocab = c.vocab.map<Reviewable>((v) => ({ id: v.id, kind: 'vocab', item: v }))
  const grammar = c.grammar.map<Reviewable>((g) => ({ id: g.id, kind: 'grammar', item: g }))
  const sentence = c.sentences.map<Reviewable>((s) => ({ id: s.id, kind: 'sentence', item: s }))
  const out: Reviewable[] = [...kana]
  const max = Math.max(kanji.length, vocab.length, grammar.length, sentence.length)
  for (let i = 0; i < max; i++) {
    if (kanji[i]) out.push(kanji[i])
    if (vocab[i]) out.push(vocab[i])
    if (grammar[i]) out.push(grammar[i])
    if (sentence[i]) out.push(sentence[i])
  }
  return out
}

/**
 * Retrieval mode for an item (leech-aware), with one runtime guard the pure selector can't make:
 * typed reading only works when the reading is clean hiragana — katakana loanwords make romaji
 * long-vowel input too fiddly, so those fall back to free recall. `audio` gates the listening
 * mode (D-028) so a device with no Japanese voice never schedules a silent card.
 */
function resolveMode(r: Reviewable, st: ItemState | undefined, audio: boolean): RetrievalMode {
  const mode = retrievalModeFor(r.kind, st?.stage ?? 0, { leech: st?.leech, seed: st?.lapses, audio })
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

/** When `itemIds` is set, the session reviews exactly those items (Classroom seed/capture,
 *  D-035) instead of computing due/intro from the scheduler. An id with no existing state is
 *  seeded `provisional` (D-021 semantics, reused as-is: a wrong first answer clears the flag and
 *  resets to stage 0 without counting as a lapse) — the forgiving, guess-then-reveal grading the
 *  pretesting-effect seed session needs, for free, from the scheduler's existing placement path.
 *  An id that already has state (capture) reviews under its normal stage — no special handling. */
export interface ReviewOptions {
  itemIds?: string[]
}

export function useReview(levels: Level[], options: ReviewOptions = {}): ReviewApi {
  const { itemIds } = options
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
    kanaRomaji: [],
    grammarGloss: [],
    sentenceEn: [],
  })
  const shownAtRef = useRef<number>(Date.now())
  // Whether a device Japanese voice exists — gates listening-mode scheduling (D-028). A ref, not
  // state, so a mid-session voice load never re-modes the card already on screen; the next card
  // reads the fresh value. Updated on `voiceschanged` (voices populate asynchronously).
  const audioRef = useRef<boolean>(hasJapaneseVoice())
  const failTsRef = useRef<Map<string, number[]>>(new Map())
  // Due-day histogram, maintained incrementally so anti-clumping is O(1) per grade.
  const histRef = useRef<Map<number, number>>(new Map())

  useEffect(() => {
    let alive = true
    void (async () => {
      let content: Content
      let states: ItemState[]
      let journal: JournalEntry[]
      try {
        // A class session (D-035) isn't gated by the learner's active JLPT levels — the
        // classbook spans whatever levels its real grammar/vocab lands at, independent of what
        // the learner has toggled on for ordinary review — so it resolves against every level.
        content = await loadLevels(itemIds ? [...ALL_LEVELS] : levels)
        ;[states, journal] = await Promise.all([getAllItemStates(), getJournal()])
      } catch (e) {
        if (!alive) return
        setError(e instanceof Error ? e.message : 'Could not load your progress or content.')
        setMode('error')
        return
      }
      if (!alive) return

      const pool = buildPool(content)
      poolRef.current = pool
      poolsRef.current = buildPools(content)
      byIdRef.current = new Map(pool.map((r) => [r.id, r]))
      statesRef.current = new Map(states.map((s) => [s.itemId, s]))

      const now = Date.now()

      if (itemIds) {
        // Preserve the caller's order (seed/capture already sorted the lesson's own item order).
        const session = itemIds
          .map((id) => byIdRef.current.get(id))
          .filter((r): r is Reviewable => r !== undefined)
        for (const r of session) {
          if (statesRef.current.has(r.id)) continue
          const seeded: ItemState = { ...newState(r.id, now), provisional: true }
          statesRef.current.set(r.id, seeded)
          void putItemState(seeded)
        }
        histRef.current = loadHistogram([...statesRef.current.values()])
        setQueue(session)
        setSessionSize(session.length)
        setMode(session.length > 0 ? 'review' : 'summary')
        return
      }

      // Fail history for leech detection (architecture §5) — pruned to the 30-day window at load.
      const failTs = new Map<string, number[]>()
      const cutoff = now - LEECH_WINDOW_MS
      for (const e of journal) {
        if (e.outcome !== 'fail' || e.ts < cutoff) continue
        const arr = failTs.get(e.itemId) ?? []
        arr.push(e.ts)
        failTs.set(e.itemId, arr)
      }
      failTsRef.current = failTs

      // Load-shape the due set (only items in the active levels); slide the lowest-stakes overflow.
      const dueInPool = dueItems(now, states).filter((s) => byIdRef.current.has(s.itemId))
      const { keep, slide } = shapeDueQueue(dueInPool, now)
      for (const s of slide) {
        statesRef.current.set(s.itemId, s)
        void putItemState(s)
      }
      const due = keep
        .map((s) => byIdRef.current.get(s.itemId))
        .filter((r): r is Reviewable => r !== undefined)

      // True daily introduction cap: only what's left of today's budget (architecture §5).
      const introIds = pickNewItems(pool.map((r) => r.id), states, introBudget(states, now))
      for (const id of introIds) {
        const st = newState(id, now)
        statesRef.current.set(id, st)
        void putItemState(st)
      }
      const intro = introIds
        .map((id) => byIdRef.current.get(id))
        .filter((r): r is Reviewable => r !== undefined)

      // Seed the histogram from the final scheduled state (post slide + intro).
      histRef.current = loadHistogram([...statesRef.current.values()])

      const session = [...due, ...intro]
      setQueue(session)
      setSessionSize(session.length)
      setMode(session.length > 0 ? 'review' : 'summary')
    })()
    return () => {
      alive = false
    }
  }, [levels, itemIds])

  // Keep the audio-availability gate current: voices load asynchronously (voiceschanged).
  useEffect(() => {
    const s = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null
    if (!s) return
    const update = () => {
      audioRef.current = hasJapaneseVoice()
    }
    s.addEventListener('voiceschanged', update)
    return () => s.removeEventListener('voiceschanged', update)
  }, [])

  const grade = useCallback(
    (outcome: Outcome) => {
      const cur = queue[0]
      if (!cur) return
      // Side effects run once here (not inside the setQueue updater, which React may double-invoke).
      if (mode === 'review') {
        const now = Date.now()
        const prev = statesRef.current.get(cur.id) ?? newState(cur.id, now)
        // Log the mode the user actually saw — pre-review stage, leech-, reading- and audio-aware.
        const interaction = resolveMode(cur, prev, audioRef.current)
        const latencyMs = Math.max(0, Math.round(now - shownAtRef.current))
        const next = applyReview(prev, outcome, now)
        // Track fail history and (re)flag leeches — 3 fails / 30 days (architecture §5).
        if (outcome === 'fail') {
          const arr = failTsRef.current.get(cur.id) ?? []
          arr.push(now)
          failTsRef.current.set(cur.id, arr)
        }
        next.leech = isLeech(failTsRef.current.get(cur.id) ?? [], now)
        // Anti-clumping via the incrementally-maintained histogram: move cur's slot, then snap.
        const h = histRef.current
        const oldDay = dayIndex(prev.due)
        h.set(oldDay, Math.max(0, (h.get(oldDay) ?? 0) - 1))
        next.due = snapToLightestDay(next.due, now, h)
        h.set(dayIndex(next.due), (h.get(dayIndex(next.due)) ?? 0) + 1)
        statesRef.current.set(cur.id, next)
        void putItemState(next)
        void appendJournal({ itemId: cur.id, ts: now, interaction, outcome, latencyMs })
      }
      setReviewed((r) => r + 1)
      if (queue.length <= 1) setMode('summary')
      setQueue((q) => q.slice(1))
    },
    [queue, mode],
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
    const rmode = resolveMode(current, statesRef.current.get(current.id), audioRef.current)
    // Recall and typed cards need no multiple-choice options; recognition and listening do.
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
