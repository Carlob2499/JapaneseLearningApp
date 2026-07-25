import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import TraceCanvas from './TraceCanvas'
import type { StrokeItem } from '@hikkoshi/schemas'
import type { GuideShape } from './traceGeometry'

afterEach(cleanup)

const item: StrokeItem = {
  kind: 'strokes',
  id: 'strokes:一',
  literal: '一',
  level: 'L1',
  kanjivgId: '04e00',
  viewBox: '0 0 109 109',
  strokes: ['M11,54 L96,55', 'M20,20 L80,80'],
  strokeCount: 2,
}

// A fixed horizontal guide reused for every stroke — the injected sampler bypasses real path
// geometry entirely (getTotalLength/getPointAtLength don't exist in jsdom; production never
// overrides this prop, only tests do).
const fixedGuide: GuideShape = { start: { x: 12, y: 54 }, end: { x: 96, y: 55 }, mid: [{ x: 54, y: 54 }] }
const guideShapeOf = () => fixedGuide

function stubRect(svg: SVGSVGElement) {
  svg.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 109, height: 109, right: 109, bottom: 109, x: 0, y: 0, toJSON: () => {} }) as DOMRect
}

function drawStroke(svg: SVGSVGElement, points: Array<{ x: number; y: number }>) {
  fireEvent.pointerDown(svg, { clientX: points[0].x, clientY: points[0].y, pointerId: 1 })
  for (const p of points.slice(1)) fireEvent.pointerMove(svg, { clientX: p.x, clientY: p.y, pointerId: 1 })
  fireEvent.pointerUp(svg, { clientX: points[points.length - 1].x, clientY: points[points.length - 1].y, pointerId: 1 })
}

describe('TraceCanvas', () => {
  it('renders one guide per stroke, the first active and the rest pending', () => {
    render(<TraceCanvas item={item} onComplete={() => {}} guideShapeOf={guideShapeOf} />)
    expect(screen.getByTestId('trace-progress').textContent).toBe('Stroke 1 of 2')
    const svg = screen.getByRole('img')
    expect(svg.querySelectorAll('.trace-guide.active')).toHaveLength(1)
    expect(svg.querySelectorAll('.trace-guide.pending')).toHaveLength(1)
    expect(svg.querySelectorAll('.trace-guide.done')).toHaveLength(0)
  })

  it('advances to the next stroke on a correct trace', () => {
    render(<TraceCanvas item={item} onComplete={() => {}} guideShapeOf={guideShapeOf} />)
    const svg = screen.getByRole('img') as unknown as SVGSVGElement
    stubRect(svg)
    drawStroke(svg, [
      { x: 12, y: 54 },
      { x: 54, y: 54 },
      { x: 96, y: 55 },
    ])
    expect(screen.getByTestId('trace-progress').textContent).toBe('Stroke 2 of 2')
    expect(svg.querySelectorAll('.trace-guide.done')).toHaveLength(1)
  })

  it('stays on the same stroke after a wrong trace', () => {
    render(<TraceCanvas item={item} onComplete={() => {}} guideShapeOf={guideShapeOf} />)
    const svg = screen.getByRole('img') as unknown as SVGSVGElement
    stubRect(svg)
    drawStroke(svg, [
      { x: 5, y: 5 },
      { x: 8, y: 6 },
      { x: 10, y: 9 },
    ])
    expect(screen.getByTestId('trace-progress').textContent).toBe('Stroke 1 of 2')
    expect(svg.querySelectorAll('.trace-guide.done')).toHaveLength(0)
  })

  it('calls onComplete once the last stroke is correctly traced', () => {
    const onComplete = vi.fn()
    render(<TraceCanvas item={item} onComplete={onComplete} guideShapeOf={guideShapeOf} />)
    const svg = screen.getByRole('img') as unknown as SVGSVGElement
    stubRect(svg)
    const trace = () =>
      drawStroke(svg, [
        { x: 12, y: 54 },
        { x: 54, y: 54 },
        { x: 96, y: 55 },
      ])
    trace()
    expect(onComplete).not.toHaveBeenCalled()
    trace()
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('trace-progress').textContent).toBe('2 strokes traced')
  })
})
