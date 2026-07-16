import { isReducedMotion } from '../motion/reducedMotion'

export const ARRIVAL_KEY = 'hikkoshi:arrival-shown'

/** Whether the one-time arrival title sequence should play (D-033): never under reduced motion,
 *  never twice on the same device, and never if storage is unavailable (fail closed — no
 *  set-piece is always the safe answer). */
export function shouldPlayArrival(): boolean {
  try {
    return !isReducedMotion() && localStorage.getItem(ARRIVAL_KEY) !== 'yes'
  } catch {
    return false
  }
}

/** Record that the sequence has been seen — written at mount, so an interrupted run counts. */
export function markArrivalShown(): void {
  try {
    localStorage.setItem(ARRIVAL_KEY, 'yes')
  } catch {
    // storage unavailable — the gate already fails closed for next time
  }
}
