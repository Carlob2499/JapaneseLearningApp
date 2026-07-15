import type { JournalEntry, SceneTemplate } from '@hikkoshi/schemas'
import { dayIndex } from '../scheduler/loadShaper'

/** Total tasks a single day's plan will ever surface (review + errands combined). */
export const DAY_PLAN_MAX_TASKS = 4

/** Exhaustive over `SceneTemplate['sceneKind']` — the Today panel's errand button text. */
export const SCENE_KIND_TITLE: Record<SceneTemplate['sceneKind'], string> = {
  konbini: 'Konbini checkout',
  transit: 'Catch your train',
}

export type DayTask =
  | { kind: 'review'; dueCount: number; introCount: number }
  | { kind: 'errand'; sceneId: string; title: string }

export interface DayPlan {
  tasks: DayTask[]
}

export interface BuildDayPlanInput {
  dueCount: number
  introCount: number
  candidates: SceneTemplate[]
  history: Map<string, number>
  todayIndex: number
  cap?: number
}

/**
 * Last-shown day index per scene, from the append-only journal (`sceneId` written since
 * Phase 1's D-017) — no new persisted storage. Keeps the max day seen per scene, so an
 * out-of-order journal read still resolves to the true most-recent showing; entries with no
 * `sceneId` (ordinary flashcard reviews) are ignored.
 */
export function deriveSceneHistory(journal: JournalEntry[]): Map<string, number> {
  const history = new Map<string, number>()
  for (const e of journal) {
    if (!e.sceneId) continue
    const day = dayIndex(e.ts)
    const prev = history.get(e.sceneId)
    if (prev === undefined || day > prev) history.set(e.sceneId, day)
  }
  return history
}

function daysSinceShown(sceneId: string, history: Map<string, number>, todayIndex: number): number {
  const last = history.get(sceneId)
  return last === undefined ? Number.POSITIVE_INFINITY : todayIndex - last
}

/**
 * An honest, never-padded task list (D-018 decision 1): a review task only when something is
 * actually due or introducible, and one errand task per candidate scene — sorted stalest-first
 * (never-shown scenes sort first of all) but never filtered out, so a stale-but-only candidate
 * still surfaces (decision 4: staleness is a sort preference, never a filter). Review is
 * prioritized first when present; `cap` bounds the combined total.
 */
export function buildDayPlan(input: BuildDayPlanInput): DayPlan {
  const { dueCount, introCount, candidates, history, todayIndex, cap = DAY_PLAN_MAX_TASKS } = input
  const tasks: DayTask[] = []
  if (dueCount > 0 || introCount > 0) tasks.push({ kind: 'review', dueCount, introCount })

  const sorted = [...candidates].sort(
    (a, b) => daysSinceShown(b.id, history, todayIndex) - daysSinceShown(a.id, history, todayIndex),
  )
  for (const scene of sorted) {
    if (tasks.length >= cap) break
    tasks.push({ kind: 'errand', sceneId: scene.id, title: SCENE_KIND_TITLE[scene.sceneKind] })
  }
  return { tasks }
}
