// Small, pure helpers for the shell. Kept dependency-free so they are trivially testable.
import type { Level } from '@hikkoshi/schemas'
import manifest from '../../content/packs/manifest.json'

export const APP_NAME = 'Hikkoshi'
export const APP_NAME_JA = '引っ越し'

/** Total dataset-verified items across all committed content packs. */
export function packItemCount(): number {
  return manifest.packs.reduce((sum, p) => sum + p.itemCount, 0)
}

/** Dataset-verified item count for one level (summed across its four domains). */
export function levelItemCount(level: Level): number {
  return manifest.packs.filter((p) => p.level === level).reduce((sum, p) => sum + p.itemCount, 0)
}

/** JLPT label for each internal level (L1≈N5 … L5≈N1); levels are community estimates (D-005). */
export const JLPT_LABEL: Record<Level, string> = {
  L0: 'pre-N5',
  L1: 'N5',
  L2: 'N4',
  L3: 'N3',
  L4: 'N2',
  L5: 'N1',
}
