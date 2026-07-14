import type { ReactNode } from 'react'
import { useEnterAnimation } from './useEnterAnimation'

/**
 * Wraps children in a div that fades+rises in on mount. Give the caller's element a `key` (a
 * card id, a scene step index) so each remount replays the animation — this is what closes the
 * "new card/step appears with zero motion" gap without touching every consumer's own layout.
 */
export function EnterOnMount({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useEnterAnimation<HTMLDivElement>()
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
