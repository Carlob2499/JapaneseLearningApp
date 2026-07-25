import { isReducedMotion } from '../motion/reducedMotion'

const KEY_PREFIX = 'hikkoshi:kanji-sheet-shown:'

/** Whether the one-time "sheet complete" ceremony should play for this lesson (D-037): never
 *  under reduced motion, never twice for the same lesson, never if storage is unavailable — the
 *  exact ArrivalTitle laws (D-033), scoped per lesson instead of once per device. */
export function shouldPlayKanjiSheetCeremony(lessonNumber: number): boolean {
  try {
    return !isReducedMotion() && localStorage.getItem(KEY_PREFIX + lessonNumber) !== 'yes'
  } catch {
    return false
  }
}

/** Record that this lesson's ceremony has been seen — written at mount, so an interrupted run counts. */
export function markKanjiSheetCeremonyShown(lessonNumber: number): void {
  try {
    localStorage.setItem(KEY_PREFIX + lessonNumber, 'yes')
  } catch {
    // storage unavailable — the gate already fails closed for next time
  }
}
