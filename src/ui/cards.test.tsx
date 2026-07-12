import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ChoiceCard, TypedCard } from './cards'
import type { Choice } from '../review/choices'

afterEach(cleanup)

const choices: Choice[] = [
  { text: 'to eat', correct: true },
  { text: 'to drink', correct: false },
  { text: 'blue', correct: false },
]

function renderCard(onGrade: (o: 'pass' | 'fail' | 'partial') => void) {
  render(
    <ChoiceCard
      kind="Vocabulary"
      prompt={<span>食べる</span>}
      question="Which meaning?"
      choices={choices}
      onGrade={onGrade}
    />,
  )
}

describe('ChoiceCard', () => {
  it('renders one button per choice and the question', () => {
    renderCard(() => {})
    expect(screen.getAllByTestId('choice')).toHaveLength(3)
    expect(screen.getByText('Which meaning?')).toBeTruthy()
  })

  it('grades pass when the correct option is chosen', () => {
    const onGrade = vi.fn()
    renderCard(onGrade)
    fireEvent.click(screen.getByText('to eat'))
    fireEvent.click(screen.getByText('Next →'))
    expect(onGrade).toHaveBeenCalledWith('pass')
  })

  it('grades fail when a wrong option is chosen', () => {
    const onGrade = vi.fn()
    renderCard(onGrade)
    fireEvent.click(screen.getByText('to drink'))
    fireEvent.click(screen.getByText('Next →'))
    expect(onGrade).toHaveBeenCalledWith('fail')
  })
})

describe('TypedCard', () => {
  function renderTyped(onGrade: (o: 'pass' | 'fail' | 'partial') => void) {
    render(<TypedCard kind="Vocabulary" prompt={<span>食べる</span>} answer="たべる" onGrade={onGrade} />)
  }

  it('grades pass when the typed reading matches (romaji auto-converts to kana)', () => {
    const onGrade = vi.fn()
    renderTyped(onGrade)
    fireEvent.change(screen.getByTestId('typed-input'), { target: { value: 'taberu' } })
    fireEvent.click(screen.getByText('Check'))
    fireEvent.click(screen.getByText('Next →'))
    expect(onGrade).toHaveBeenCalledWith('pass')
  })

  it('grades fail and reveals the answer when wrong', () => {
    const onGrade = vi.fn()
    renderTyped(onGrade)
    fireEvent.change(screen.getByTestId('typed-input'), { target: { value: 'みる' } })
    fireEvent.click(screen.getByText('Check'))
    expect(screen.getByTestId('typed-feedback').textContent).toContain('たべる')
    fireEvent.click(screen.getByText('Next →'))
    expect(onGrade).toHaveBeenCalledWith('fail')
  })
})
