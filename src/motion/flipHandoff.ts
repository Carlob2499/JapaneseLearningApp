// Side-effect-only: gsap/Flip's ambient Flip.FlipState type merges globally once this module's
// .d.ts is loaded — no named import needed, and (crucially) no runtime Flip code ships until
// Commit 4 actually registers/uses the plugin.
import 'gsap/Flip'

/**
 * A tiny plain-module singleton handing off Flip.getState() results between the component that
 * initiates a navigation (captures state before the DOM changes) and the component that lands on
 * the destination view (applies it after mount). This codebase has zero React.createContext usage
 * anywhere (D-019) — a plain singleton matches existing convention better than introducing Context.
 * Last-write-wins: a second stash before the first is taken silently replaces it, so a rapid
 * double-tap degrades to "only the latest navigation's Flip state survives," never a crash.
 */
let pending: { tag: string; state: Flip.FlipState } | null = null

export function stash(tag: string, state: Flip.FlipState): void {
  pending = { tag, state }
}

/** Returns and clears the pending state only if it matches `tag`; otherwise leaves it untouched. */
export function take(tag: string): Flip.FlipState | null {
  if (!pending || pending.tag !== tag) return null
  const { state } = pending
  pending = null
  return state
}
