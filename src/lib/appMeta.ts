// Small, pure helpers for the shell. Kept dependency-free so they are trivially testable.
import manifest from '../../content/packs/manifest.json'

export const APP_NAME = 'Hikkoshi'
export const APP_NAME_JA = '引っ越し'

/** Total dataset-verified items across all committed content packs. */
export function packItemCount(): number {
  return manifest.packs.reduce((sum, p) => sum + p.itemCount, 0)
}

/** Session-4 scaffold milestone; replaced by real progression state in later sessions. */
export interface RailStatus {
  readonly label: string
  readonly done: boolean
}

export function railChecklist(swSupported: boolean): RailStatus[] {
  const items = packItemCount()
  return [
    { label: 'Vite + React + TypeScript shell', done: true },
    { label: 'Installable PWA manifest', done: true },
    { label: 'Service worker & versioned precache', done: swSupported },
    {
      label: `Content packs — ${items.toLocaleString()} dataset-verified vocab & kanji`,
      done: items > 0,
    },
    { label: 'SRS scheduler & day loop', done: false },
  ]
}

/** True when running as an installed PWA rather than a browser tab. */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
  )
}
