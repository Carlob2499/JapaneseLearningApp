import { useCallback, useEffect, useState } from 'react'
import type { ItemState, JournalEntry, Level } from '@hikkoshi/schemas'
import { loadLevels, type Content } from '../content/packs'
import { appendJournal, getAllItemStates, getJournal } from '../store/db'
import { dueItems, pickNewItems } from '../scheduler/srs'
import { dayIndex, introBudget, shapeDueQueue } from '../scheduler/loadShaper'
import { reviewablePoolIds } from '../lib/appMeta'
import { computeLifeStage, type LifeStage } from './lifeStage'
import { isSceneUnlocked } from './moduleUnlock'
import { buildDayPlan, deriveSceneHistory, type DayPlan } from './dayPlan'
import { pickDiaryEntries, type DiaryEntry } from './diary'

export type TodayMode = 'loading' | 'ready' | 'error'

export interface TodayApi {
  mode: TodayMode
  error: string | null
  dueCount: number
  introCount: number
  lifeStage: LifeStage | null
  dayPlan: DayPlan | null
  diaryEntries: DiaryEntry[]
  isRevealed: (itemId: string) => boolean
  revealGloss: (itemId: string) => void
}

/**
 * Derives the whole Today panel from already-loaded content + progress — self-fetching, like
 * `useScene`. Computes dueCount/introCount with the same primitives `useReview` uses to build
 * a session (`dueItems`+`shapeDueQueue`, `pickNewItems`+`introBudget`), but these are preview
 * counts only: unlike `useReview`, this hook never calls `putItemState` (the anti-clump slide
 * and new-item persistence only happen once a real review session runs).
 */
export function useToday(levels: Level[]): TodayApi {
  const [mode, setMode] = useState<TodayMode>('loading')
  const [error, setError] = useState<string | null>(null)
  const [dueCount, setDueCount] = useState(0)
  const [introCount, setIntroCount] = useState(0)
  const [lifeStage, setLifeStage] = useState<LifeStage | null>(null)
  const [dayPlan, setDayPlan] = useState<DayPlan | null>(null)
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([])
  const [revealed, setRevealed] = useState<Set<string>>(new Set())

  useEffect(() => {
    let alive = true
    void (async () => {
      let content: Content
      let states: ItemState[]
      let journal: JournalEntry[]
      try {
        content = await loadLevels(levels)
        ;[states, journal] = await Promise.all([getAllItemStates(), getJournal()])
      } catch (e) {
        if (!alive) return
        setError(e instanceof Error ? e.message : 'Could not load your progress or content.')
        setMode('error')
        return
      }
      if (!alive) return

      const now = Date.now()
      const allIds = levels.flatMap((l) => reviewablePoolIds(content, l))
      const idSet = new Set(allIds)

      // Read-only preview of what a review session would show — mirrors useReview's shaping
      // but never persists the slide/intro side effects (no putItemState calls here).
      const dueInPool = dueItems(now, states).filter((s) => idSet.has(s.itemId))
      const { keep } = shapeDueQueue(dueInPool, now)
      const introIds = pickNewItems(allIds, states, introBudget(states, now))

      const history = deriveSceneHistory(journal)
      const candidates = content.scenes.filter((s) => isSceneUnlocked(content, states, s))

      setDueCount(keep.length)
      setIntroCount(introIds.length)
      setLifeStage(computeLifeStage(content, states, levels))
      setDayPlan(
        buildDayPlan({
          dueCount: keep.length,
          introCount: introIds.length,
          candidates,
          history,
          todayIndex: dayIndex(now),
        }),
      )
      setDiaryEntries(pickDiaryEntries(content, journal, now))
      setMode('ready')
    })()
    return () => {
      alive = false
    }
  }, [levels])

  const isRevealed = useCallback((itemId: string) => revealed.has(itemId), [revealed])

  /** Idempotent per item: a repeat tap re-shows the already-revealed gloss without re-logging. */
  const revealGloss = useCallback(
    (itemId: string) => {
      if (revealed.has(itemId)) return
      void appendJournal({ itemId, ts: Date.now(), interaction: 'context', outcome: 'pass' })
      setRevealed((prev) => new Set(prev).add(itemId))
    },
    [revealed],
  )

  return { mode, error, dueCount, introCount, lifeStage, dayPlan, diaryEntries, isRevealed, revealGloss }
}
