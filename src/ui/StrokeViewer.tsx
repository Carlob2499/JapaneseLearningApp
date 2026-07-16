import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import type { StrokeItem } from '@hikkoshi/schemas'
import { strokeDrawIn } from '../motion/timelines'
import './study.css'

/** Animated KanjiVG stroke order (DrawSVG since D-033): each stroke inks itself in, in order.
 *  Replay remounts the SVG via `key`; reduced motion renders the finished chart instantly. */
export default function StrokeViewer({ item }: { item: StrokeItem }) {
  const [runId, setRunId] = useState(0)
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
    </div>
  )
}
