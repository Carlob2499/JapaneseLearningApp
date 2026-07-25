import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { openDB } from 'idb'
import type { StrokeItem } from '@hikkoshi/schemas'
import { appendJournal, getJournal } from '../store/db'
import KanjiSheet from './KanjiSheet'
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
  localStorage.clear()
})
afterEach(cleanup)

function stroke(literal: string): StrokeItem {
  return {
    kind: 'strokes',
    id: `strokes:${literal}`,
    literal,
    level: 'L1',
    kanjivgId: literal,
    viewBox: '0 0 109 109',
    strokes: ['M11,54 L96,55'],
    strokeCount: 1,
  }
}

const literals = ['力', '画', '能', '想', '映', '努']
const strokesByLiteral = new Map(literals.map((c) => [c, stroke(c)]))

const fixedGuide: GuideShape = { start: { x: 12, y: 54 }, end: { x: 96, y: 55 }, mid: [{ x: 54, y: 54 }] }
const guideShapeOf = () => fixedGuide

function stubRect(svg: SVGSVGElement) {
  svg.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 109, height: 109, right: 109, bottom: 109, x: 0, y: 0, toJSON: () => {} }) as DOMRect
}

function traceCorrectly(svg: SVGSVGElement) {
  const points = [
    { x: 12, y: 54 },
    { x: 54, y: 54 },
    { x: 96, y: 55 },
  ]
  fireEvent.pointerDown(svg, { clientX: points[0].x, clientY: points[0].y, pointerId: 1 })
  for (const p of points.slice(1)) fireEvent.pointerMove(svg, { clientX: p.x, clientY: p.y, pointerId: 1 })
  fireEvent.pointerUp(svg, { clientX: points[2].x, clientY: points[2].y, pointerId: 1 })
}

describe('KanjiSheet', () => {
  it('renders all six cells, reflecting already-persisted trace entries', async () => {
    await appendJournal({ itemId: 'strokes:力', ts: 1, interaction: 'trace', outcome: 'pass' })
    await appendJournal({ itemId: 'strokes:画', ts: 2, interaction: 'trace', outcome: 'pass' })

    render(
      <KanjiSheet literals={literals} strokesByLiteral={strokesByLiteral} lessonNumber={1} onClose={() => {}} />,
    )
    const cells = await screen.findAllByTestId('trace-cell')
    expect(cells).toHaveLength(6)
    expect(cells.filter((c) => c.getAttribute('data-traced') === 'true')).toHaveLength(2)
    expect(cells.filter((c) => c.getAttribute('data-traced') === 'false')).toHaveLength(4)
  })

  it('opens the canvas for an untraced cell, and Back returns to the grid', async () => {
    render(
      <KanjiSheet literals={literals} strokesByLiteral={strokesByLiteral} lessonNumber={1} onClose={() => {}} guideShapeOf={guideShapeOf} />,
    )
    const cells = await screen.findAllByTestId('trace-cell')
    fireEvent.click(cells[0])
    expect(screen.getByTestId('trace-progress')).toBeTruthy()

    fireEvent.click(screen.getByText('← Back to the sheet'))
    expect(await screen.findAllByTestId('trace-cell')).toHaveLength(6)
  })

  it('a correct trace persists a journal entry and marks the cell traced', async () => {
    render(
      <KanjiSheet literals={literals} strokesByLiteral={strokesByLiteral} lessonNumber={1} onClose={() => {}} guideShapeOf={guideShapeOf} />,
    )
    const cells = await screen.findAllByTestId('trace-cell')
    fireEvent.click(cells[0])
    const svg = screen.getByRole('img') as unknown as SVGSVGElement
    stubRect(svg)
    traceCorrectly(svg)

    const updatedCells = await screen.findAllByTestId('trace-cell')
    expect(updatedCells.filter((c) => c.getAttribute('data-traced') === 'true')).toHaveLength(1)

    const journal = await getJournal()
    expect(journal).toHaveLength(1)
    expect(journal[0]).toMatchObject({ itemId: 'strokes:力', interaction: 'trace', outcome: 'pass' })
  })

  it('never shows the sheet-complete ceremony under reduced motion (the jsdom default), even completing the last cell', async () => {
    for (const c of literals.slice(1)) {
      await appendJournal({ itemId: `strokes:${c}`, ts: 1, interaction: 'trace', outcome: 'pass' })
    }
    render(
      <KanjiSheet literals={literals} strokesByLiteral={strokesByLiteral} lessonNumber={1} onClose={() => {}} guideShapeOf={guideShapeOf} />,
    )
    const cells = await screen.findAllByTestId('trace-cell')
    fireEvent.click(cells[0]) // the one remaining untraced cell (力)
    const svg = screen.getByRole('img') as unknown as SVGSVGElement
    stubRect(svg)
    traceCorrectly(svg)

    await screen.findAllByTestId('trace-cell')
    expect(screen.queryByText('完成')).toBeNull()
  })

  it('disables a cell whose literal has no stroke data, instead of throwing', async () => {
    const sparse = new Map([['力', stroke('力')]])
    render(<KanjiSheet literals={['力', '未知']} strokesByLiteral={sparse} lessonNumber={1} onClose={() => {}} />)
    const cells = await screen.findAllByTestId('trace-cell')
    expect((cells[1] as HTMLButtonElement).disabled).toBe(true)
  })
})
