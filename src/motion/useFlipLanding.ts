import { useRef, type RefObject } from 'react'
import { useGSAP } from '@gsap/react'
import { Flip } from 'gsap/Flip'
import { take } from './flipHandoff'

/**
 * On mount, checks for a Flip state stashed under `tag` by whichever element the learner tapped
 * to navigate here — if present, morphs this element from that captured shape into its own
 * natural position/size (Material's Container Transform recipe: the shape settles, then
 * `fade: true` cross-fades whatever content differs, since the two elements are otherwise
 * unrelated pieces of UI). Falls back to nothing extra if no state was stashed — a direct load
 * or an unmatched tag — leaving the container-level fade from useViewTransition as the only
 * motion, never a broken or missing transition.
 */
export function useFlipLanding<T extends Element>(tag: string): RefObject<T | null> {
  const ref = useRef<T>(null)
  useGSAP(() => {
    const state = take(tag)
    if (state && ref.current) {
      Flip.from(state, { targets: ref.current, duration: 0.5, ease: 'power1.inOut', fade: true })
    }
  }, [])
  return ref
}
