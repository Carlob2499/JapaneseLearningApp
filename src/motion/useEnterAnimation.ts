import { useRef, type RefObject } from 'react'
import { useGSAP } from '@gsap/react'
import { enterTimeline } from './timelines'

/**
 * Fades+rises an element in on mount. Pair with a remounting `key` (e.g. a per-card or
 * per-scene-step wrapper) to replay on every navigation — a key change causes React to fully
 * unmount the old instance and mount a fresh one, so useGSAP's setup naturally reruns each time,
 * no manual dependency tracking needed.
 */
export function useEnterAnimation<T extends Element>(): RefObject<T | null> {
  const ref = useRef<T>(null)
  useGSAP(
    () => {
      if (ref.current) enterTimeline(ref.current)
    },
    { scope: ref },
  )
  return ref
}
