import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { shouldPlayArrival } from './arrivalGate'
import { DayEndSummary } from './ReviewSession'

afterEach(cleanup)
beforeEach(() => localStorage.clear())

describe('shouldPlayArrival (D-033)', () => {
  it('never plays under reduced motion (the jsdom default), flag or no flag', () => {
    expect(shouldPlayArrival()).toBe(false)
    localStorage.setItem('hikkoshi:arrival-shown', 'yes')
    expect(shouldPlayArrival()).toBe(false)
  })
})

describe('DayEndSummary (D-033)', () => {
  it('renders the finished state at first paint: final count, operable buttons', () => {
    const onPractice = vi.fn()
    const onHome = vi.fn()
    render(<DayEndSummary reviewed={17} onPracticeMore={onPractice} onHome={onHome} />)
    // Reduced motion runs no timeline — the count is the real number immediately.
    expect(screen.getByText('17')).toBeTruthy()
    expect(screen.getByText('Session complete')).toBeTruthy()
    fireEvent.click(screen.getByText('Practice more (untracked)'))
    expect(onPractice).toHaveBeenCalled()
    fireEvent.click(screen.getByText('Back home'))
    expect(onHome).toHaveBeenCalled()
  })
})
