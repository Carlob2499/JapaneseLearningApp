import { describe, it, expect, afterEach, vi } from 'vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import type { StrokeItem, VocabItem } from '@hikkoshi/schemas'
import StrokeViewer from './StrokeViewer'
import { VocabCard } from './cards'

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
