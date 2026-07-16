import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

// Signature easing curves (D-033). Registered here, in their first consumer module, per the
// register-at-first-consumer convention Flip established in flipHandoff.ts. CustomEase.create
// with a raw path string is pure math — safe under jsdom.
gsap.registerPlugin(CustomEase)

/** The sliding shoji door: strong early velocity, a long friction settle, a dead stop. */
CustomEase.create('shoji', 'M0,0 C0.32,0.94 0.44,1 1,1')

/** A hanko pressed into paper: accelerate in, micro-compress past the mark, settle back. */
CustomEase.create('hankoPress', 'M0,0 C0.62,0 0.78,0.42 0.82,0.98 C0.86,1.06 0.93,1.01 1,1')

/** Ease names, exported so consumers import this module (which forces registration order). */
export const SIGNATURE_EASE = { shoji: 'shoji', hanko: 'hankoPress' } as const
