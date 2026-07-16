import { useCallback, useRef, useState, type RefObject } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { isReducedMotion } from './reducedMotion'
import { SIGNATURE_EASE } from './eases'
import { enterTimeline, exitTimeline } from './timelines'
import { isShojiCovered, shojiClose, shojiOpen } from './shoji'

export interface ViewTransitionApi<V> {
  view: V
  /** Attach to the single persistent element whose content is swapped on navigation. */
  containerRef: RefObject<HTMLElement | null>
  /** Sweeps the shoji panels shut, swaps to `next` beneath cover, then parts the doors (D-033).
   *  Under reduced motion this is the original quiet fade. A second call while one is already in
   *  flight is ignored (no queueing — a mid-wipe tap is simply dropped). */
  navigate: (next: V) => void
}

/**
 * Generic view-swap transition (D-019, reworked for the shoji wipe in D-033): one persistent
 * container, whichever view is "current" renders inside it. Non-reduced navigations run the
 * signature shoji screen wipe — panels close (0.18s), the React swap commits beneath cover, and
 * the post-commit effect below parts the doors (0.26s) over the already-painted new view, so
 * there is no flicker window. The reduced-motion path is byte-identical to the original fade
 * (exit → swap → enter), which is also what jsdom tests exercise. Never fires on initial mount.
 * Flip-based shared-element transitions (Home's two task buttons) still layer on top: their
 * Flip.from starts under cover and its tail plays as the doors part.
 */
export function useViewTransition<V>(initial: V | (() => V)): ViewTransitionApi<V> {
  const [view, setView] = useState<V>(initial)
  const containerRef = useRef<HTMLElement>(null)
  const pendingRef = useRef<V | null>(null)
  const isFirstRender = useRef(true)
  // Mirror of `view` for the stable navigate callback (guards same-view calls, which would
  // otherwise skip the re-render this hook relies on to open the doors again).
  const viewRef = useRef(view)
  viewRef.current = view

  useGSAP(
    () => {
      if (isFirstRender.current) {
        isFirstRender.current = false
        return
      }
      const el = containerRef.current
      if (!el) return
      if (isShojiCovered()) {
        // Post-commit: the new view is already painted beneath the closed panels. Settle it
        // under the parting doors and open.
        gsap.fromTo(el, { y: 14 }, { y: 0, duration: 0.4, ease: SIGNATURE_EASE.shoji, clearProps: 'y' })
        shojiOpen(() => {
          pendingRef.current = null
        })
      } else {
        enterTimeline(el) // reduced / fallback path — unchanged from D-019
      }
    },
    { dependencies: [view], scope: containerRef },
  )

  const navigate = useCallback((next: V) => {
    if (pendingRef.current !== null || next === viewRef.current) return
    const el = containerRef.current
    if (!el) {
      setView(next)
      return
    }
    pendingRef.current = next
    if (isReducedMotion()) {
      exitTimeline(el).eventCallback('onComplete', () => {
        setView(pendingRef.current as V)
        pendingRef.current = null
      })
      return
    }
    // pendingRef stays held until shojiOpen completes (cleared in the effect above), so taps
    // during the whole wipe are dropped, matching the original in-flight semantics.
    shojiClose(() => setView(pendingRef.current as V))
  }, [])

  return { view, containerRef, navigate }
}
