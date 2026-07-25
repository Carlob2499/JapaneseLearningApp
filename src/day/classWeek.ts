import type { ItemState, LessonTemplate } from '@hikkoshi/schemas'
import { daysSinceClass, type ClassSettings } from '../store/classSettings'

/**
 * The week's shape around a class day (D-035), evidence-based (docs/roadmap-2.md §2.2):
 * seed 1–2 days before class (pretesting effect — attempted retrieval before instruction
 * improves the lesson itself); capture on class day and the day after (same-evening retrieval
 * exploits sleep-dependent consolidation); strengthen for the rest of the week (class items are
 * simply live in the normal interleaved review queue — no special task). Day-granularity only;
 * "class day evening" and "the day after" are merged into one capture day rather than gated by
 * time-of-day, since nothing else in the day-planning layer reasons about hours.
 */
export type ClassPhase = 'off' | 'seed' | 'class' | 'capture' | 'strengthen'

export function phaseFor(now: Date, settings: ClassSettings): ClassPhase {
  if (!settings.enabled) return 'off'
  const d = daysSinceClass(now, settings.classDay)
  if (d === 0) return 'class'
  if (d === 1) return 'capture'
  if (d <= 4) return 'strengthen'
  return 'seed' // d === 5 or 6 (2 or 1 days before the next class)
}

/** A lesson's items considered "met" at least once — anything with a progress record. Coarse for
 *  now (D-035); D-036/D-038 refine this toward a production-based "solid" threshold. */
export function lessonReadiness(lesson: LessonTemplate, states: readonly ItemState[]): number {
  const ids = [...lesson.grammarIds, ...lesson.vocabIds]
  if (ids.length === 0) return 0
  const known = new Set(states.map((s) => s.itemId))
  const met = ids.filter((id) => known.has(id)).length
  return met / ids.length
}

/** The class-specific day task, if the current phase calls for one — 'seed' and 'capture' only;
 *  'class'/'strengthen'/'off' surface no special task (strengthen relies on ordinary interleaved
 *  review; class day is the class itself). `itemIds` is exactly what a session would cover:
 *  not-yet-met items for seed, already-met items for capture — never padded with the other kind,
 *  and carried whole (not just a count) so the caller can start a session on it directly. */
export function buildClassTask(
  phase: ClassPhase,
  lesson: LessonTemplate,
  states: readonly ItemState[],
):
  | { kind: 'class-seed'; lessonId: string; itemIds: string[] }
  | { kind: 'class-capture'; lessonId: string; itemIds: string[] }
  | null {
  if (phase !== 'seed' && phase !== 'capture') return null
  const ids = [...lesson.grammarIds, ...lesson.vocabIds]
  const known = new Set(states.map((s) => s.itemId))
  if (phase === 'seed') {
    const itemIds = ids.filter((id) => !known.has(id))
    return itemIds.length > 0 ? { kind: 'class-seed', lessonId: lesson.id, itemIds } : null
  }
  const itemIds = ids.filter((id) => known.has(id))
  return itemIds.length > 0 ? { kind: 'class-capture', lessonId: lesson.id, itemIds } : null
}
