import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import type { StrokeItem } from '@hikkoshi/schemas'
import { traceInk, traceWrong } from '../motion/timelines'
import { validateStroke, type GuideShape, type Point } from './traceGeometry'
import './trace.css'

/**
 * Real-browser stroke geometry (D-037): samples a guide path's length and points along it.
 * Called ONLY from pointer handlers, never at render/mount — the jsdom law extension this slice
 * adds (getTotalLength/getPointAtLength don't exist in jsdom and throw if reached at mount).
 */
function browserGuideShape(path: SVGPathElement): GuideShape {
  const length = path.getTotalLength()
  const at = (d: number): Point => {
    const p = path.getPointAtLength(d)
    return { x: p.x, y: p.y }
  }
  return { start: at(0), end: at(length), mid: [0.25, 0.5, 0.75].map((f) => at(length * f)) }
}

/** Pointer client coordinates -> the SVG's own viewBox space, via the element's own bounding
 *  box. Simpler than getScreenCTM and jsdom-safe (getBoundingClientRect never throws) — this
 *  canvas is never rotated or skewed, so a straight ratio is exact. */
function toSvgPoint(rect: DOMRect, clientX: number, clientY: number, vbWidth: number, vbHeight: number): Point {
  const x = rect.width > 0 ? ((clientX - rect.left) / rect.width) * vbWidth : 0
  const y = rect.height > 0 ? ((clientY - rect.top) / rect.height) * vbHeight : 0
  return { x, y }
}

export interface TraceCanvasProps {
  item: StrokeItem
  onComplete: () => void
  /** Injectable for tests (state-machine coverage without real jsdom geometry) — defaults to
   *  real SVG sampling. Production never overrides this. */
  guideShapeOf?: (path: SVGPathElement) => GuideShape
}

/**
 * Trace a kanji's strokes in order, on top of its faint KanjiVG guide (D-037). Each attempt is
 * validated (start/end proximity + direction + coarse shape, `traceGeometry.ts`) against the
 * *current* guide stroke only — strokes must land in KanjiVG's own order. A correct trace inks
 * the guide in (DrawSVG); a wrong one shakes + pulses it and the same stroke stays active.
 */
export default function TraceCanvas({ item, onComplete, guideShapeOf = browserGuideShape }: TraceCanvasProps) {
  const [activeStroke, setActiveStroke] = useState(0)
  const [drawing, setDrawing] = useState<Point[]>([])
  const guidePathRefs = useRef<Array<SVGPathElement | null>>([])
  const pointerActive = useRef(false)
  const { contextSafe } = useGSAP()

  const [, , vbWidthStr, vbHeightStr] = item.viewBox.split(/\s+/)
  const vbWidth = Number(vbWidthStr)
  const vbHeight = Number(vbHeightStr)
  const done = activeStroke >= item.strokes.length

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (done) return
    pointerActive.current = true
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Pointer capture is a progressive enhancement (keeps tracking a drag that leaves the
      // canvas); its absence just means a stroke abandoned mid-drag won't auto-continue.
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setDrawing([toSvgPoint(rect, e.clientX, e.clientY, vbWidth, vbHeight)])
  }

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!pointerActive.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    setDrawing((pts) => [...pts, toSvgPoint(rect, e.clientX, e.clientY, vbWidth, vbHeight)])
  }

  const onPointerUp = contextSafe((e: React.PointerEvent<SVGSVGElement>) => {
    if (!pointerActive.current) return
    pointerActive.current = false
    const path = guidePathRefs.current[activeStroke]
    // The release itself carries the true final position — a real drag's last pointermove
    // rarely lands exactly where the pointer lifts, so it must be captured here, not assumed
    // already present in `drawing`.
    const rect = e.currentTarget.getBoundingClientRect()
    const pts = [...drawing, toSvgPoint(rect, e.clientX, e.clientY, vbWidth, vbHeight)]
    setDrawing([])
    if (!path || pts.length < 2) return
    const ok = validateStroke(pts, guideShapeOf(path))
    if (ok) {
      traceInk(path)
      const next = activeStroke + 1
      setActiveStroke(next)
      if (next >= item.strokes.length) onComplete()
    } else {
      traceWrong(path)
    }
  })

  return (
    <div className="trace-canvas">
      <svg
        viewBox={item.viewBox}
        className="trace-svg"
        role="img"
        aria-label={
          done
            ? `${item.literal}, all ${item.strokeCount} strokes traced`
            : `Trace ${item.literal}, stroke ${activeStroke + 1} of ${item.strokeCount}`
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {item.strokes.map((d, i) => (
          <path
            key={i}
            ref={(el) => {
              guidePathRefs.current[i] = el
            }}
            d={d}
            className={`trace-guide${i < activeStroke ? ' done' : i === activeStroke ? ' active' : ' pending'}`}
          />
        ))}
        {drawing.length > 1 && (
          <polyline className="trace-live" points={drawing.map((p) => `${p.x},${p.y}`).join(' ')} />
        )}
      </svg>
      <p className="trace-progress fineprint" data-testid="trace-progress">
        {done ? `${item.strokeCount} strokes traced` : `Stroke ${activeStroke + 1} of ${item.strokeCount}`}
      </p>
    </div>
  )
}
