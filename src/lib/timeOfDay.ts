/** Time-of-day buckets for the Home hero's wash (D-026) — the neighborhood photo is tinted to
 *  the learner's actual clock, so the app's one day-loop reads as *your* day. Dark color scheme
 *  always renders the night wash regardless of bucket (handled in CSS). */
export type TimeBucket = 'morning' | 'day' | 'dusk' | 'night'

export function timeBucket(hour: number): TimeBucket {
  if (hour >= 5 && hour < 10) return 'morning'
  if (hour >= 10 && hour < 16) return 'day'
  if (hour >= 16 && hour < 19) return 'dusk'
  return 'night'
}
