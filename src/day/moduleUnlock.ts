import type { ItemState, ModuleTag, SceneTemplate } from '@hikkoshi/schemas'
import type { Content } from '../content/packs'

/**
 * Coverage-gated real-world scene unlock (curriculum §5 P5: "modules unlock as vocabulary
 * coverage grows" — no numeric threshold specified there; each entry is a documented,
 * adjustable judgment call, see D-018). A module absent from this map is always unlocked.
 * `M2_konbini` is pinned to 0 deliberately: it's curriculum's own "entry N5" module and the
 * only one with any tagged vocab today, so gating it would regress Phase 1's
 * always-available errand for zero benefit.
 */
export const MODULE_UNLOCK_THRESHOLD: Partial<Record<ModuleTag, number>> = {
  M2_konbini: 0,
}

export interface ModuleCoverage {
  module: ModuleTag
  covered: number
  total: number
  ratio: number
}

/**
 * Share of a module's tagged vocab that already carries an `ItemState`. These items are
 * ordinary level-scheduled flashcards (module tags don't gate flashcard review), so this
 * rises through normal review regardless of whether the module's own scene is unlocked yet.
 */
export function moduleCoverage(
  content: Content,
  states: ItemState[] | Map<string, ItemState>,
  module: ModuleTag,
): ModuleCoverage {
  const stateIds = states instanceof Map ? new Set(states.keys()) : new Set(states.map((s) => s.itemId))
  const ids = content.vocab.filter((v) => v.modules.includes(module)).map((v) => v.id)
  const total = ids.length
  const covered = total === 0 ? 0 : ids.filter((id) => stateIds.has(id)).length
  const ratio = total === 0 ? 0 : covered / total
  return { module, covered, total, ratio }
}

/** `threshold` defaults to this module's configured entry (0 if absent) but is overridable for testing. */
export function isModuleUnlocked(
  coverage: ModuleCoverage,
  module: ModuleTag,
  threshold = MODULE_UNLOCK_THRESHOLD[module] ?? 0,
): boolean {
  return threshold <= 0 || coverage.ratio >= threshold
}

/**
 * A multi-module scene unlocks only once every tagged module clears its own threshold
 * (conjunctive AND) — a scene draws on all of its modules at once, so any one gate blocks it.
 */
export function isSceneUnlocked(
  content: Content,
  states: ItemState[] | Map<string, ItemState>,
  scene: SceneTemplate,
  thresholds: Partial<Record<ModuleTag, number>> = MODULE_UNLOCK_THRESHOLD,
): boolean {
  return scene.modules.every((m) => isModuleUnlocked(moduleCoverage(content, states, m), m, thresholds[m] ?? 0))
}

/**
 * Life-stage gate (D-030): a scene with a `minStage` only becomes an errand once the learner has
 * reached that stage (the behind-the-counter shift waits for Part-timer, stage 2 — you get the job
 * before you can work it). A scene without `minStage` is available at every stage.
 */
export function sceneMeetsStage(scene: SceneTemplate, stage: number): boolean {
  return (scene.minStage ?? 0) <= stage
}
