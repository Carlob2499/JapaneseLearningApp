// Classroom settings live in localStorage (D-034), same convention as store/settings.ts —
// separate from the IndexedDB progress store, since this is device preference, not learning data.

const KEY = 'hikkoshi:class'

export interface ClassSettings {
  /** Off by default — the Classroom thread only appears once a learner opts in. */
  enabled: boolean
  /** Classbook id, matches a shipped `content/packs/class/<book>.json`. */
  book: string
  /** JS Date#getDay() convention: 0 = Sunday … 6 = Saturday. Defaults to Wednesday. */
  classDay: number
  /** 1-indexed lesson within the book the learner is currently on. */
  lesson: number
  /** The learner's own six-kanji weekly sheet, from their class handout — overrides the
   *  book's shipped default week for the current lesson. Unset until they edit it. */
  weeklyKanjiOverride?: string[]
}

const DEFAULTS: ClassSettings = { enabled: false, book: 'quartet1', classDay: 3, lesson: 1 }

function isValid(v: unknown): v is Partial<ClassSettings> {
  return typeof v === 'object' && v !== null
}

/** Read the stored settings, defaulted and sanitized — always returns a usable value. */
export function getClassSettings(): ClassSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed: unknown = JSON.parse(raw)
    if (!isValid(parsed)) return { ...DEFAULTS }
    const classDay = Number.isInteger(parsed.classDay) && parsed.classDay! >= 0 && parsed.classDay! <= 6
      ? parsed.classDay!
      : DEFAULTS.classDay
    const lesson = Number.isInteger(parsed.lesson) && parsed.lesson! >= 1 ? parsed.lesson! : DEFAULTS.lesson
    const weeklyKanjiOverride =
      Array.isArray(parsed.weeklyKanjiOverride) && parsed.weeklyKanjiOverride.length === 6
        ? (parsed.weeklyKanjiOverride as string[])
        : undefined
    return {
      enabled: parsed.enabled === true,
      book: typeof parsed.book === 'string' && parsed.book.length > 0 ? parsed.book : DEFAULTS.book,
      classDay,
      lesson,
      ...(weeklyKanjiOverride ? { weeklyKanjiOverride } : {}),
    }
  } catch {
    return { ...DEFAULTS }
  }
}

/** Merge + persist a partial update, returning the canonical result. */
export function setClassSettings(patch: Partial<ClassSettings>): ClassSettings {
  const next = { ...getClassSettings(), ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // best-effort — ignore quota / availability errors
  }
  return next
}

/** Days from `now` to the next occurrence of `classDay` (0 = today is class day, 1–6 = upcoming). */
export function daysUntilClass(now: Date, classDay: number): number {
  return (classDay - now.getDay() + 7) % 7
}

const DISCOVERY_KEY = 'hikkoshi:class-discovery-dismissed'

/** Whether the learner has dismissed Home's one-time "taking a class?" discovery card. */
export function isClassDiscoveryDismissed(): boolean {
  try {
    return localStorage.getItem(DISCOVERY_KEY) === 'yes'
  } catch {
    return false
  }
}

export function dismissClassDiscovery(): void {
  try {
    localStorage.setItem(DISCOVERY_KEY, 'yes')
  } catch {
    // best-effort — ignore quota / availability errors
  }
}
