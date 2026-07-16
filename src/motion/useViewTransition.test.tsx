import { describe, it, expect, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { RefObject } from 'react'
import { useViewTransition } from './useViewTransition'

afterEach(cleanup)

function Probe() {
  const { view, containerRef, navigate } = useViewTransition<'a' | 'b'>('a')
  return (
    <div ref={containerRef as RefObject<HTMLDivElement>}>
      <span data-testid="view">{view}</span>
      <button onClick={() => navigate('b')}>go-b</button>
      <button onClick={() => navigate('a')}>go-a</button>
    </div>
  )
}

// jsdom always reports reduced motion ON, so these tests exercise the quiet-fade path — the
// same collapsed branch every unit test in this repo runs (D-019). The shoji overlay must never
// be created on this path (D-033).
describe('useViewTransition (reduced-motion branch)', () => {
  it('navigates to the next view after the exit fade', async () => {
    render(<Probe />)
    expect(screen.getByTestId('view').textContent).toBe('a')
    fireEvent.click(screen.getByText('go-b'))
    await waitFor(() => expect(screen.getByTestId('view').textContent).toBe('b'))
  })

  it('never creates the shoji overlay under reduced motion', async () => {
    render(<Probe />)
    fireEvent.click(screen.getByText('go-b'))
    await waitFor(() => expect(screen.getByTestId('view').textContent).toBe('b'))
    expect(document.querySelector('.shoji-overlay')).toBeNull()
  })

  it('drops a second navigation while one is in flight', async () => {
    render(<Probe />)
    fireEvent.click(screen.getByText('go-b'))
    fireEvent.click(screen.getByText('go-a')) // mid-flight — dropped
    await waitFor(() => expect(screen.getByTestId('view').textContent).toBe('b'))
    // Give any (incorrectly queued) second transition a beat to surface; the view must hold.
    await new Promise((r) => setTimeout(r, 250))
    expect(screen.getByTestId('view').textContent).toBe('b')
  })

  it('ignores a navigation to the current view', async () => {
    render(<Probe />)
    fireEvent.click(screen.getByText('go-a')) // already on 'a' — must not wedge the hook
    await new Promise((r) => setTimeout(r, 250))
    expect(screen.getByTestId('view').textContent).toBe('a')
    // ...and a real navigation still works afterwards.
    fireEvent.click(screen.getByText('go-b'))
    await waitFor(() => expect(screen.getByTestId('view').textContent).toBe('b'))
  })
})
