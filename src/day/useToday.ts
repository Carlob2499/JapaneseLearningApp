import { useCallback, useEffect, useState } from 'react'
import type { ItemState, JournalEntry, Level } from '@hikkoshi/schemas'
import { loadClassbook, loadLevels, type Content } from '../content/packs'
import { appendJournal, getAllItemStates, getJournal } from '../store/db'
import { dueItems, pickNewItems } from '../scheduler/srs'
import {
  DEFAULT_DUE_CEILING,
  WARM_RETURN_CAP,
  applyAmnesty,
  dayIndex,
  introBudget,
  isWarmReturn,
  shapeDueQueue,
} from '../scheduler/loadShaper'
import { reviewablePoolIds } from '../lib/appMeta'
import { getClassSettings } from '../store/classSettings'
import { getLastCelebratedStage, setLastCelebratedStage } from '../store/settings'
import { buildClassTask, lessonReadiness, phaseFor } from './classWeek'
import { computeLifeStage, decideCelebration, type LifeStage } from './lifeStage'
import { isSceneUnlocked, sceneMeetsStage } from './moduleUnlock'
import { buildDayPlan, deriveSceneHistory, type DayPlan } from './dayPlan'
import { pickDiaryEntries, type DiaryEntry } from './diary'
import { daysInJapan, isLapsedReturn, weekCells, type WeekCell } from './rhythm'

export type TodayMode = 'loading' | 'ready' | 'error'

export interface TodayApi {
  mode: TodayMode
  error: string | null
  dueCount: number
  introCount: number
  lifeStage: LifeStage | null
  /** The stage to celebrate this load, or null if none — set at most once per genuine stage
   *  increase, never on a fresh profile's first-ever read (see decideCelebration). */
  celebrateStage: number | null
  dayPlan: DayPlan | null
  diaryEntries: DiaryEntry[]
  isRevealed: (itemId: string) => boolean
  revealGloss: (itemId: string) => void
  /** The return loop's rhythm data (D-038) — the current week's 7 cells and "days in Japan," for
   *  Home's header strip. */
  weekCells: WeekCell[]
  daysInJapan: number
  isLapsedReturn: boolean
  /** The current lesson's readiness (0-1), null when class mode is off — reused from the same
   *  classbook fetch buildClassTask already needs, for the class-eve glow (D-038). */
  classReadiness: number | null
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
  const [celebrateStage, setCelebrateStage] = useState<number | null>(null)
  const [dayPlan, setDayPlan] = useState<DayPlan | null>(null)
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([])
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [weekCellsState, setWeekCellsState] = useState<WeekCell[]>([])
  const [daysInJapanState, setDaysInJapanState] = useState(1)
  const [lapsed, setLapsed] = useState(false)
  const [classReadinessState, setClassReadinessState] = useState<number | null>(null)

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
      // (amnesty then warm-return-aware ceiling) but never persists any slide (no putItemState
      // calls here).
      const dueInPool = dueItems(now, states).filter((s) => idSet.has(s.itemId))
      const { keep: afterAmnesty } = applyAmnesty(dueInPool, now)
      const warmReturn = isWarmReturn(afterAmnesty)
      const { keep } = shapeDueQueue(afterAmnesty, now, warmReturn ? WARM_RETURN_CAP : DEFAULT_DUE_CEILING)
      const introIds = pickNewItems(allIds, states, introBudget(states, now))

      const history = deriveSceneHistory(journal)
      const stage = computeLifeStage(content, states, levels)
      // A scene surfaces only when its module coverage gate opens AND the learner has reached its
      // life-stage gate (D-030 — the behind-the-counter shift waits until Part-timer).
      const candidates = content.scenes.filter(
        (s) => isSceneUnlocked(content, states, s) && sceneMeetsStage(s, stage.stage),
      )

      const celebration = decideCelebration(stage.stage, getLastCelebratedStage())
      if (celebration.newBaseline !== undefined) setLastCelebratedStage(celebration.newBaseline)

      // The Classroom thread's task for today (D-035) — level-independent (item states aren't
      // scoped to active levels), so it degrades to no task rather than failing Today's load if
      // the classbook can't be reached (offline before its first fetch).
      const classSettings = getClassSettings()
      let classTask = null
      let classReadiness: number | null = null
      if (classSettings.enabled) {
        try {
          const book = await loadClassbook(classSettings.book)
          const lesson = book.lessons.find((l) => l.lesson === classSettings.lesson)
          if (lesson) {
            classTask = buildClassTask(phaseFor(new Date(now), classSettings), lesson, states)
            classReadiness = lessonReadiness(lesson, states)
          }
        } catch {
          // offline or not-yet-cached — Today still works, just without the class task
        }
      }
      if (!alive) return

      setDueCount(keep.length)
      setIntroCount(introIds.length)
      setLifeStage(stage)
      setCelebrateStage(celebration.celebrate ? stage.stage : null)
      setWeekCellsState(weekCells(now, journal, classSettings))
      setDaysInJapanState(daysInJapan(journal, now))
      setLapsed(isLapsedReturn(journal, now))
      setClassReadinessState(classReadiness)
      setDayPlan(
        buildDayPlan({
          dueCount: keep.length,
          introCount: introIds.length,
          isWarmReturn: warmReturn,
          candidates,
          history,
          todayIndex: dayIndex(now),
          classTask,
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

  return {
    mode,
    error,
    dueCount,
    introCount,
    lifeStage,
    celebrateStage,
    dayPlan,
    diaryEntries,
    isRevealed,
    revealGloss,
    weekCells: weekCellsState,
    daysInJapan: daysInJapanState,
    isLapsedReturn: lapsed,
    classReadiness: classReadinessState,
  }
}
