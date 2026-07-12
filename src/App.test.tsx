import { describe, expect, it, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import App from './App'

afterEach(cleanup)

describe('App', () => {
  it('opens on the home screen with a start button', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Hikkoshi' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /start today's review/i })).toBeTruthy()
  })

  it('shows the required content disclosure (D-005) up front', () => {
    render(<App />)
    expect(screen.getByText(/community estimates/i)).toBeTruthy()
  })
})
