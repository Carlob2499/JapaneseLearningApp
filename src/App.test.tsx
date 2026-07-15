import { describe, expect, it, afterEach, beforeEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import App from './App'
import { setOnboarded } from './store/settings'

beforeEach(() => setOnboarded(true))
afterEach(cleanup)

describe('App', () => {
  it('opens on the home screen with a start button', async () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Hikkoshi' })).toBeTruthy()
    expect(await screen.findByRole('button', { name: /start today's review/i })).toBeTruthy()
  })

  it('shows the required content disclosure (D-005) up front', () => {
    render(<App />)
    expect(screen.getByText(/community estimates/i)).toBeTruthy()
  })

  it("shows the learner's life stage once today's data loads", async () => {
    render(<App />)
    expect(await screen.findByText('Tourist')).toBeTruthy()
  })

  it('gates a fresh profile behind onboarding, before any Home content shows', () => {
    setOnboarded(false)
    render(<App />)
    // The first-run fork: place, or start at the beginning — never straight to Home.
    expect(screen.getByRole('button', { name: /studied before/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /start at the beginning/i })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /start today's review/i })).toBeNull()
  })
})
