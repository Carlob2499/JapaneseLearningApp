import { useState, type ReactNode, type RefObject } from 'react'
import type { Level } from '@hikkoshi/schemas'
import Home from './ui/Home'
import Journey from './ui/Journey'
import Onboarding from './ui/Onboarding'
import PlacementProbe from './ui/PlacementProbe'
import ReviewSession from './ui/ReviewSession'
import SceneView from './ui/SceneView'
import { useViewTransition } from './motion/useViewTransition'
import { getActiveLevels, getOnboarded, levelsUpTo, setActiveLevels, setOnboarded } from './store/settings'
import './App.css'

type View = 'onboarding' | 'placement' | 'home' | 'review' | 'scene' | 'journey'

export default function App() {
  const { view, containerRef, navigate } = useViewTransition<View>(() =>
    getOnboarded() ? 'home' : 'onboarding',
  )
  const [levels, setLevels] = useState<Level[]>(() => getActiveLevels())
  const [sceneId, setSceneId] = useState<string | null>(null)

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
      />
    )
  }

  return <div ref={containerRef as RefObject<HTMLDivElement>}>{content}</div>
}
