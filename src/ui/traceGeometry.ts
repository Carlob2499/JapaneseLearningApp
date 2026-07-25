/**
 * Coarse stroke-shape validation for TraceCanvas (D-037) — pure, no DOM. Checks a user-drawn
 * polyline against a guide stroke by start/end proximity, overall direction, and a few sampled
 * midpoints, on the fixed 109×109 KanjiVG canvas. Deliberately forgiving (this grades whether a
 * learner drew *this stroke, in this direction*, not calligraphy) — if per-stroke shape matching
 * proves fragile at real-device walkthrough, the roadmap pre-approves degrading to start/end +
 * direction only (drop the midpoint loop below); record that call in D-037 if it happens.
 */
export interface Point {
  x: number
  y: number
}

/** A guide stroke reduced to the handful of points validation needs — start, end, and a few
 *  points sampled along its length (typically quarter/half/three-quarter). */
export interface GuideShape {
  start: Point
  end: Point
  mid: Point[]
}

const START_END_TOLERANCE = 26 // px, on the 109×109 canvas — generous for finger/mouse imprecision
const MID_TOLERANCE = 34 // slightly looser: users naturally bow curves in/out
const MIN_DIRECTION_VECTOR = 10 // below this, a guide's displacement is too small to grade direction (dot/tick strokes)
const DIRECTION_COS_MIN = 0.2 // ~78° tolerance either side of the guide's direction

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** Whether `userPoints` (a captured pointerdown→move→up polyline) is a plausible trace of `guide`. */
export function validateStroke(userPoints: readonly Point[], guide: GuideShape): boolean {
  if (userPoints.length < 2) return false
  const first = userPoints[0]
  const last = userPoints[userPoints.length - 1]
  if (dist(first, guide.start) > START_END_TOLERANCE) return false
  if (dist(last, guide.end) > START_END_TOLERANCE) return false

  const guideVec = { x: guide.end.x - guide.start.x, y: guide.end.y - guide.start.y }
  const guideLen = Math.hypot(guideVec.x, guideVec.y)
  if (guideLen >= MIN_DIRECTION_VECTOR) {
    const userVec = { x: last.x - first.x, y: last.y - first.y }
    const userLen = Math.hypot(userVec.x, userVec.y)
    if (userLen < 1e-6) return false
    const cos = (guideVec.x * userVec.x + guideVec.y * userVec.y) / (guideLen * userLen)
    if (cos < DIRECTION_COS_MIN) return false
  }

  for (const m of guide.mid) {
    const nearest = Math.min(...userPoints.map((p) => dist(p, m)))
    if (nearest > MID_TOLERANCE) return false
  }
  return true
}
