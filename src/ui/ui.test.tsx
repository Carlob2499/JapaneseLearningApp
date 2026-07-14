import { describe, it, expect, afterEach, vi } from 'vitest'
import { act, cleanup, render, screen, fireEvent } from '@testing-library/react'
import type { StrokeItem, VocabItem } from '@hikkoshi/schemas'
import StrokeViewer from './StrokeViewer'
import { VocabCard } from './cards'
import { SpeedTimer } from './SceneView'

afterEach(cleanup)

const strokeItem: StrokeItem = {
  kind: 'strokes',
  id: 'strokes:水',
  literal: '水',
  level: 'L1',
  kanjivgId: '06c34',
  viewBox: '0 0 109 109',
  strokes: ['M1', 'M2', 'M3', 'M4'],
  strokeCount: 4,
}

const vocab: VocabItem = {
  kind: 'vocab',
  id: 'vocab:1',
  jmdictSeq: 1,
  expression: '水',
  reading: 'みず',
  senses: [{ gloss: ['water'], pos: ['n'] }],
  level: 'L1',
  modules: [],
}

describe('StrokeViewer', () => {
  it('renders one path per stroke on a 109×109 canvas', () => {
    const { container } = render(<StrokeViewer item={strokeItem} />)
    expect(container.querySelectorAll('path.stroke-path')).toHaveLength(4)
    expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 109 109')
  })
})

describe('VocabCard', () => {
  it('hides the answer until revealed, then grades', () => {
    const onGrade = vi.fn()
    render(<VocabCard item={vocab} onGrade={onGrade} />)
    expect(screen.queryByText('みず')).toBeNull()
    fireEvent.click(screen.getByText('Reveal'))
    expect(screen.getByText('みず')).toBeTruthy()
    fireEvent.click(screen.getByText('Good'))
    expect(onGrade).toHaveBeenCalledWith('pass')
  })
})

describe('SpeedTimer (speed beat countdown, D-020)', () => {
  it('fires onTimeout exactly once when the countdown elapses', () => {
    vi.useFakeTimers()
    try {
      const onTimeout = vi.fn()
      render(<SpeedTimer seconds={6} stopped={false} onTimeout={onTimeout} />)
      expect(onTimeout).not.toHaveBeenCalled()
      act(() => vi.advanceTimersByTime(6000))
      expect(onTimeout).toHaveBeenCalledTimes(1)
      act(() => vi.advanceTimersByTime(6000)) // no double-fire after it lands
      expect(onTimeout).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('never fires once stopped — the learner picked in time', () => {
    vi.useFakeTimers()
    try {
      const onTimeout = vi.fn()
      render(<SpeedTimer seconds={6} stopped onTimeout={onTimeout} />)
      act(() => vi.advanceTimersByTime(20000))
      expect(onTimeout).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('shows a check mark instead of a number once stopped', () => {
    render(<SpeedTimer seconds={6} stopped onTimeout={() => {}} />)
    expect(screen.getByText('✓')).toBeTruthy()
  })
})
