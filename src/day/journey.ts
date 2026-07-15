/** Stamp-book state for one life-stage row (D-025): `stamped` = earned (eki-stamp pressed),
 *  `current` = the stage being worked toward (shows the blocking level's progress ring),
 *  `ahead` = still down the line (a dotted, waiting circle). */
export type StampState = 'stamped' | 'current' | 'ahead'

/** `currentStage` is `LifeStage.stage` — the number of contiguous cleared levels. Stage 0
 *  (Tourist) is always stamped: arriving is the one stamp you get for free. */
export function stampStateFor(stageIndex: number, currentStage: number): StampState {
  if (stageIndex <= currentStage) return 'stamped'
  if (stageIndex === currentStage + 1) return 'current'
  return 'ahead'
}

/** The hanko glyph pressed into each stage's stamp: 着 for arrival, then the stage numerals. */
export const STAMP_GLYPHS: readonly string[] = ['着', '一', '二', '三', '四', '五']

/** Handwritten journal line per stage (model-written English framing only — D-002-safe). */
export const JOURNEY_NOTES: readonly string[] = [
  'Two suitcases and a phrasebook.',
  'The konbini clerk knows my face now.',
  'First shift. My name tag is spelled right.',
  'They handed me the morning keys.',
  'The new hire asks me the questions now.',
  "Someone else's first day. I remember mine.",
]
