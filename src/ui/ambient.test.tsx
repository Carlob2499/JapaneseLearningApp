import { describe, it, expect, afterEach } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import AmbientLayer from './AmbientLayer'
import { useAmbientGround } from './useAmbientGround'

afterEach(cleanup)

describe('AmbientLayer (D-033)', () => {
  it('renders nothing under reduced motion — the collapsed world is perfectly still', () => {
    const { container } = render(<AmbientLayer season="spring" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing in summer regardless (the wash carries the season alone)', () => {
    const { container } = render(<AmbientLayer season="summer" />)
    expect(container.firstChild).toBeNull()
  })
})

function GroundProbe() {
  const ground = useAmbientGround()
  return <span data-testid="ground">{`${ground.tod}/${ground.season}`}</span>
}

describe('useAmbientGround (D-033)', () => {
  it('stamps a valid tod and season onto the document element', async () => {
    render(<GroundProbe />)
    await waitFor(() => {
      expect(['morning', 'day', 'dusk', 'night']).toContain(document.documentElement.dataset.tod)
      expect(['spring', 'tsuyu', 'summer', 'autumn', 'winter']).toContain(
        document.documentElement.dataset.season,
      )
    })
  })
})
