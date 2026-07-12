// Small, pure helpers for the shell. Kept dependency-free so they are trivially testable.
import manifest from '../../content/packs/manifest.json'

export const APP_NAME = 'Hikkoshi'
export const APP_NAME_JA = '引っ越し'

/** Total dataset-verified items across all committed content packs. */
export function packItemCount(): number {
  return manifest.packs.reduce((sum, p) => sum + p.itemCount, 0)
}
