import { useState, type ReactNode, type RefObject } from 'react'
import type { Level } from '@hikkoshi/schemas'
import AmbientLayer from './ui/AmbientLayer'
import ArrivalTitle from './ui/ArrivalTitle'
import { shouldPlayArrival } from './ui/arrivalGate'
import Classroom from './ui/Classroom'
import Emergency from './ui/Emergency'
import Home from './ui/Home'
import Journey from './ui/Journey'
import Onboarding from './ui/Onboarding'
import PlacementProbe from './ui/PlacementProbe'
import ReviewSession from './ui/ReviewSession'
import SceneView from './ui/SceneView'
import { useViewTransition } from './motion/useViewTransition'
import { useAmbientGround } from './ui/useAmbientGround'
import { getActiveLevels, getOnboarded, levelsUpTo, setActiveLevels, setOnboarded } from './store/settings'
import './App.css'

type View = 'onboarding' | 'placement' | 'home' | 'review' | 'scene' | 'journey' | 'emergency' | 'classroom'

export default function App() {
  const { view, containerRef, navigate } = useViewTransition<View>(() =>
    getOnboarded() ? 'home' : 'onboarding',
  )
  const ground = useAmbientGround()
  const [levels, setLevels] = useState<Level[]>(() => getActiveLevels())
  const [sceneId, setSceneId] = useState<string | null>(null)
  // The one-time arrival title (D-033): first launch only, never under reduced motion.
  const [arrival, setArrival] = useState<boolean>(() => !getOnboarded() && shouldPlayArrival())

  function toggleLevel(level: Level) {
    setLevels((prev) => {
      const next = prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
      return setActiveLevels(next) // persists, canonicalises, never empty
    })
  }

  function finishOnboarding(placed: Level) {
    const next = levelsUpTo(placed) // L1 for a beginner (L0); L1…placed otherwise
    setLevels(setActiveLevels(next))
    setOnboarded(true)
    navigate('home')
  }

  let content: ReactNode
  if (view === 'onboarding') {
    content = (
      <Onboarding
        onBeginner={() => finishOnboarding('L0')}
        onPlacement={() => navigate('placement')}
      />
    )
  } else if (view === 'placement') {
    content = <PlacementProbe onDone={finishOnboarding} />
  } else if (view === 'review') {
    content = <ReviewSession levels={levels} onHome={() => navigate('home')} />
  } else if (view === 'scene' && sceneId) {
    content = <SceneView levels={levels} sceneId={sceneId} onExit={() => navigate('home')} />
  } else if (view === 'journey') {
    content = <Journey onHome={() => navigate('home')} />
  } else if (view === 'emergency') {
    content = <Emergency onHome={() => navigate('home')} />
  } else if (view === 'classroom') {
    content = <Classroom onHome={() => navigate('home')} />
  } else {
    content = (
      <Home
        levels={levels}
        onToggleLevel={toggleLevel}
        onStart={() => navigate('review')}
        onStartScene={(id) => {
          setSceneId(id)
          navigate('scene')
        }}
        onJourney={() => navigate('journey')}
        onEmergency={() => navigate('emergency')}
        onClassroom={() => navigate('classroom')}
      />
    )
  }

  return (
    <>
      {/* The kisetsu weather layer sits outside the transition container — the shoji wipe and
          view fades never touch it (D-033). */}
      <AmbientLayer season={ground.season} />
      <div ref={containerRef as RefObject<HTMLDivElement>}>{content}</div>
      {arrival && <ArrivalTitle onDone={() => setArrival(false)} />}
    </>
  )
}
