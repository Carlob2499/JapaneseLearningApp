import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import type { StrokeItem } from '@hikkoshi/schemas'
import { strokeDrawIn } from '../motion/timelines'
import { appendJournal } from '../store/db'
import TraceCanvas from './TraceCanvas'
import type { GuideShape } from './traceGeometry'
import './study.css'
import './trace.css'

export interface StrokeViewerProps {
  item: StrokeItem
  /** Test-only passthrough to TraceCanvas's injectable geometry sampler. */
  guideShapeOf?: (path: SVGPathElement) => GuideShape
}

/**
 * Animated KanjiVG stroke order (DrawSVG since D-033): each stroke inks itself in, in order.
 * Replay remounts the SVG via `key`; reduced motion renders the finished chart instantly.
 * 練習 Practice (D-037) opens TraceCanvas for hands-on stroke practice — completing it logs the
 * same journal `'trace'` entry the weekly kanji sheet reads, so practice from either surface
 * counts toward that sheet's completion.
 */
export default function StrokeViewer({ item, guideShapeOf }: StrokeViewerProps) {
  const [runId, setRunId] = useState(0)
  const [practicing, setPracticing] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const paths = rootRef.current?.querySelectorAll('.stroke-path')
      if (paths && paths.length > 0) strokeDrawIn(paths)
    },
    { dependencies: [runId], scope: rootRef },
  )

  return (
    <div className="stroke-viewer" ref={rootRef}>
      <svg
        key={runId}
        viewBox={item.viewBox}
        className="stroke-svg"
        role="img"
        aria-label={`Stroke order for ${item.literal}`}
      >
        {item.strokes.map((d, i) => (
          <path key={i} d={d} className="stroke-path" />
        ))}
      </svg>
      <button className="ghost-btn" onClick={() => setRunId((r) => r + 1)}>
        ▶ Replay {item.strokeCount} strokes
      </button>
      <button className="ghost-btn" onClick={() => setPracticing((p) => !p)}>
        {practicing ? 'Hide practice' : '練習 Practice'}
      </button>
      {practicing && (
        <TraceCanvas
          item={item}
          guideShapeOf={guideShapeOf}
          onComplete={() => {
            void appendJournal({ itemId: item.id, ts: Date.now(), interaction: 'trace', outcome: 'pass' })
            setPracticing(false)
          }}
        />
      )}
    </div>
  )
}
