import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { openDB } from 'idb'
import type { StrokeItem } from '@hikkoshi/schemas'
import { getJournal } from '../store/db'
import StrokeViewer from './StrokeViewer'
import type { GuideShape } from './traceGeometry'

async function clearDb() {
  const db = await openDB('hikkoshi', 1, {
    upgrade(d) {
      if (!d.objectStoreNames.contains('itemStates')) d.createObjectStore('itemStates', { keyPath: 'itemId' })
      if (!d.objectStoreNames.contains('journal')) d.createObjectStore('journal', { autoIncrement: true })
    },
  })
  await db.clear('itemStates')
  await db.clear('journal')
  db.close()
}

beforeEach(async () => {
  await clearDb()
})
afterEach(cleanup)

const item: StrokeItem = {
  kind: 'strokes',
  id: 'strokes:一',
  literal: '一',
  level: 'L1',
  kanjivgId: '04e00',
  viewBox: '0 0 109 109',
  strokes: ['M11,54 L96,55'],
  strokeCount: 1,
}

const fixedGuide: GuideShape = { start: { x: 12, y: 54 }, end: { x: 96, y: 55 }, mid: [{ x: 54, y: 54 }] }
const guideShapeOf = () => fixedGuide

describe('StrokeViewer', () => {
  it('shows the stroke chart and a replay button, with practice hidden until opened', () => {
    render(<StrokeViewer item={item} />)
    expect(screen.getByLabelText('Stroke order for 一')).toBeTruthy()
    expect(screen.getByText('▶ Replay 1 strokes')).toBeTruthy()
    expect(screen.queryByTestId('trace-progress')).toBeNull()
  })

  it('opens TraceCanvas on 練習 Practice, and toggles it closed again', () => {
    render(<StrokeViewer item={item} guideShapeOf={guideShapeOf} />)
    fireEvent.click(screen.getByText('練習 Practice'))
    expect(screen.getByTestId('trace-progress')).toBeTruthy()

    fireEvent.click(screen.getByText('Hide practice'))
    expect(screen.queryByTestId('trace-progress')).toBeNull()
  })

  it('logs a trace journal entry for this item once practice completes', async () => {
    render(<StrokeViewer item={item} guideShapeOf={guideShapeOf} />)
    fireEvent.click(screen.getByText('練習 Practice'))

    const svg = screen.getByRole('img', { name: /^Trace/ }) as unknown as SVGSVGElement
    svg.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 109, height: 109, right: 109, bottom: 109, x: 0, y: 0, toJSON: () => {} }) as DOMRect
    fireEvent.pointerDown(svg, { clientX: 12, clientY: 54, pointerId: 1 })
    fireEvent.pointerMove(svg, { clientX: 54, clientY: 54, pointerId: 1 })
    fireEvent.pointerUp(svg, { clientX: 96, clientY: 55, pointerId: 1 })

    // Practice auto-closes on completion (same as an explicit "Hide practice").
    expect(screen.queryByTestId('trace-progress')).toBeNull()
    const journal = await getJournal()
    expect(journal).toHaveLength(1)
    expect(journal[0]).toMatchObject({ itemId: 'strokes:一', interaction: 'trace', outcome: 'pass' })
  })
})
