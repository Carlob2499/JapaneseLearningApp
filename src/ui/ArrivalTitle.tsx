import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { revealChars } from '../motion/typeReveal'
import { APP_NAME, APP_NAME_JA } from '../lib/appMeta'
import { markArrivalShown } from './arrivalGate'
import arrivalPhoto from '../assets/photos/arrival-clouds.webp'
import './cinematic.css'

/**
 * The arrival title sequence (D-033): a one-time, first-launch-only cinematic — the wing above
 * the clouds, 引っ越し assembling character by character, the English name settling beneath —
 * 2.35 s total, tap anywhere to skip, then it hands off to onboarding and never plays again.
 * Gated by `shouldPlayArrival` in arrivalGate.ts; the flag is written on mount, so an
 * interrupted run still counts as shown.
 */
export default function ArrivalTitle({ onDone }: { onDone: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const doneRef = useRef(false)

  useEffect(() => {
    markArrivalShown()
  }, [])

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    onDone()
  }

  const { contextSafe } = useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const tl = gsap.timeline({ onComplete: finish })
      tlRef.current = tl
      tl.fromTo(root.querySelector('img'), { scale: 1.08 }, { scale: 1, duration: 2.35, ease: 'none' }, 0)
      tl.add(revealChars(root.querySelector('.arrival-mark')!, { duration: 0.55, stagger: 0.09 }), 0.15)
      tl.fromTo(
        root.querySelectorAll('.arrival-name, .arrival-tag'),
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.12 },
        0.9,
      )
      tl.to(root, { opacity: 0, duration: 0.45, ease: 'power2.in' }, 1.9)
    },
    { scope: rootRef },
  )

  const skip = contextSafe(() => {
    if (doneRef.current) return
    tlRef.current?.kill()
    if (rootRef.current) {
      gsap.to(rootRef.current, { opacity: 0, duration: 0.2, ease: 'power2.in', onComplete: finish })
    } else {
      finish()
    }
  })

  return (
    <div className="arrival-title" ref={rootRef} onPointerDown={skip} aria-hidden="true">
      <img src={arrivalPhoto} alt="" />
      <div className="arrival-stack">
        <span className="arrival-mark">{APP_NAME_JA}</span>
        <span className="arrival-name">{APP_NAME}</span>
        <p className="arrival-tag">A life in Japan, one day at a time.</p>
      </div>
    </div>
  )
}
