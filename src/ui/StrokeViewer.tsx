import { useState } from 'react'
import type { StrokeItem } from '@hikkoshi/schemas'
import './study.css'

const PER_STROKE_S = 0.55

/** Animated KanjiVG stroke-order: each stroke draws in order via stroke-dashoffset. */
export default function StrokeViewer({ item }: { item: StrokeItem }) {
  const [runId, setRunId] = useState(0)
  return (
    <div className="stroke-viewer">
      <svg
        key={runId}
        viewBox={item.viewBox}
        className="stroke-svg"
        role="img"
        aria-label={`Stroke order for ${item.literal}`}
      >
        {item.strokes.map((d, i) => (
          <path
            key={i}
            d={d}
            pathLength={1}
            className="stroke-path"
            style={{ animationDelay: `${i * PER_STROKE_S}s` }}
          />
        ))}
      </svg>
      <button className="ghost-btn" onClick={() => setRunId((r) => r + 1)}>
        ▶ Replay {item.strokeCount} strokes
      </button>
    </div>
  )
}
