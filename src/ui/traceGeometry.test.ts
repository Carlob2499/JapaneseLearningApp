import { describe, it, expect } from 'vitest'
import { validateStroke, type GuideShape, type Point } from './traceGeometry'

// A left-to-right horizontal stroke across the middle of the 109×109 canvas, roughly matching
// real KanjiVG data shape (e.g. 一).
const horizontal: GuideShape = {
  start: { x: 12, y: 54 },
  end: { x: 96, y: 55 },
  mid: [{ x: 33, y: 54 }, { x: 54, y: 54 }, { x: 75, y: 55 }],
}

function trace(points: Point[]): Point[] {
  return points
}

describe('validateStroke', () => {
  it('accepts a stroke traced along the guide, start to end', () => {
    expect(validateStroke(trace([{ x: 12, y: 54 }, { x: 33, y: 54 }, { x: 54, y: 54 }, { x: 75, y: 55 }, { x: 96, y: 55 }]), horizontal)).toBe(true)
  })

  it('accepts a slightly imprecise trace within tolerance', () => {
    expect(validateStroke(trace([{ x: 18, y: 60 }, { x: 55, y: 48 }, { x: 90, y: 62 }]), horizontal)).toBe(true)
  })

  it('rejects a stroke drawn backward (end to start)', () => {
    expect(validateStroke(trace([{ x: 96, y: 55 }, { x: 54, y: 54 }, { x: 12, y: 54 }]), horizontal)).toBe(false)
  })

  it('rejects a stroke drawn somewhere else on the canvas entirely', () => {
    expect(validateStroke(trace([{ x: 5, y: 5 }, { x: 10, y: 8 }, { x: 15, y: 6 }]), horizontal)).toBe(false)
  })

  it('rejects a stroke whose midpoint bows far off the guide', () => {
    expect(validateStroke(trace([{ x: 12, y: 54 }, { x: 54, y: 5 }, { x: 96, y: 55 }]), horizontal)).toBe(false)
  })

  it('rejects fewer than two points', () => {
    expect(validateStroke(trace([{ x: 12, y: 54 }]), horizontal)).toBe(false)
    expect(validateStroke([], horizontal)).toBe(false)
  })

  it('grades a near-dot guide (tiny displacement) on proximity alone, skipping direction', () => {
    const dot: GuideShape = { start: { x: 50, y: 20 }, end: { x: 52, y: 22 }, mid: [] }
    expect(validateStroke(trace([{ x: 48, y: 19 }, { x: 51, y: 21 }, { x: 53, y: 23 }]), dot)).toBe(true)
  })
})
