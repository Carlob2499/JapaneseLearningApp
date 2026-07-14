import { useCallback, useRef, useState, type RefObject } from 'react'
import { useGSAP } from '@gsap/react'
import { enterTimeline, exitTimeline } from './timelines'

export interface ViewTransitionApi<V> {
  view: V
  /** Attach to the single persistent element whose content is swapped on navigation. */
  containerRef: RefObject<HTMLElement | null>
  /** Fades the current content out, swaps to `next`, then fades the new content in. A second
   *  call while one is already in flight is ignored (no queueing — the last tap before a
   *  transition settles wins nothing extra, it's simply dropped). */
  navigate: (next: V) => void
}

/**
 * Generic view-swap transition (D-019): one persistent container, whichever view is "current"
 * renders inside it. Never fires on initial mount — there is nothing to transition from on the
 * very first render, and App.test.tsx's tests never trigger a navigation, so this constraint is
 * also what keeps those tests passing unmodified. Flip-based shared-element transitions (Home's
 * two task buttons) are layered on top of this by their own destination components — this hook
 * only owns the generic fade, not the Flip choreography.
 */
export function useViewTransition<V>(initial: V | (() => V)): ViewTransitionApi<V> {
  const [view, setView] = useState<V>(initial)
  const containerRef = useRef<HTMLElement>(null)
  const pendingRef = useRef<V | null>(null)
  const isFirstRender = useRef(true)

  useGSAP(
    () => {
      if (isFirstRender.current) {
        isFirstRender.current = false
        return
      }
      if (containerRef.current) enterTimeline(containerRef.current)
    },
    { dependencies: [view], scope: containerRef },
  )

  const navigate = useCallback((next: V) => {
    if (pendingRef.current !== null) return
    const el = containerRef.current
    if (!el) {
      setView(next)
      return
    }
    pendingRef.current = next
    exitTimeline(el).eventCallback('onComplete', () => {
      setView(pendingRef.current as V)
      pendingRef.current = null
    })
  }, [])

  return { view, containerRef, navigate }
}
