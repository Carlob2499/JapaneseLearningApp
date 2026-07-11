// Small, pure helpers for the shell. Kept dependency-free so they are trivially testable.

export const APP_NAME = 'Hikkoshi'
export const APP_NAME_JA = '引っ越し'

/** Session-4 scaffold milestone; replaced by real progression state in later sessions. */
export interface RailStatus {
  readonly label: string
  readonly done: boolean
}

export function railChecklist(swSupported: boolean): RailStatus[] {
  return [
    { label: 'Vite + React + TypeScript shell', done: true },
    { label: 'Installable PWA manifest', done: true },
    { label: 'Service worker & versioned precache', done: swSupported },
    { label: 'Content packs (JMdict / KANJIDIC2 / KanjiVG / Tatoeba)', done: false },
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
