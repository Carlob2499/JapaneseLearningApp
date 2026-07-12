import { describe, expect, it, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import App from './App'
import { railChecklist } from './lib/appMeta'

afterEach(cleanup)

describe('App shell', () => {
  it('renders the masthead and both cards', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Hikkoshi' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Build rail' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Project documents' })).toBeTruthy()
  })

  it('links every project document', () => {
    render(<App />)
    for (const file of ['research.md', 'curriculum.md', 'design-options.md', 'architecture.md']) {
      const link = screen
        .getAllByRole('link')
        .find((a) => (a as HTMLAnchorElement).href.endsWith(`docs/${file}`))
      expect(link, `missing link for ${file}`).toBeTruthy()
    }
  })

  it('states the level-tag disclosure (D-005) in the shell', () => {
    render(<App />)
    expect(screen.getByText(/community estimates/i)).toBeTruthy()
  })
})

describe('railChecklist', () => {
  it('marks the service worker step by capability', () => {
    const withSW = railChecklist(true)
    const withoutSW = railChecklist(false)
    expect(withSW.find((s) => s.label.includes('Service worker'))?.done).toBe(true)
    expect(withoutSW.find((s) => s.label.includes('Service worker'))?.done).toBe(false)
  })

  it('marks content packs done now that packs are committed, keeps SRS honest', () => {
    const steps = railChecklist(true)
    expect(steps.find((s) => s.label.includes('Content packs'))?.done).toBe(true)
    expect(steps.find((s) => s.label.includes('SRS'))?.done).toBe(false)
  })
})
