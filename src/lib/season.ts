/** The kisetsu bucket (D-033): which seasonal world layer the app wears. Tsuyu (梅雨, the June
 *  rainy season) gets its own bucket — rain is the most legible ambient weather Japan has. */
export type Season = 'spring' | 'tsuyu' | 'summer' | 'autumn' | 'winter'

/** Season for a 1–12 month (pass `new Date().getMonth() + 1`). Pure, like timeOfDay's timeBucket. */
export function season(month: number): Season {
  if (month >= 3 && month <= 5) return 'spring'
  if (month === 6) return 'tsuyu'
  if (month === 7 || month === 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter' // 12, 1, 2
}
