import { describe, it, expect, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

afterEach(cleanup)

function Smoke() {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      gsap.to(ref.current, { opacity: 1, duration: 0.1 })
    },
    { scope: ref },
  )
  return <div ref={ref}>hi</div>
}

describe('useGSAP infra', () => {
  it('mounts and unmounts cleanly under vitest+jsdom with the matchMedia/rAF polyfills in place', () => {
    const { unmount } = render(<Smoke />)
    expect(() => unmount()).not.toThrow()
  })
})
