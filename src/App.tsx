import { useState, type ReactNode, type RefObject } from 'react'
import type { Level } from '@hikkoshi/schemas'
import Home from './ui/Home'
import Onboarding from './ui/Onboarding'
import ReviewSession from './ui/ReviewSession'
import SceneView from './ui/SceneView'
import { useViewTransition } from './motion/useViewTransition'
import { getActiveLevels, getOnboarded, setActiveLevels, setOnboarded } from './store/settings'
import './App.css'

type View = 'onboarding' | 'home' | 'review' | 'scene'

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

  let content: ReactNode
  if (view === 'onboarding') {
    content = (
      <Onboarding
        onContinue={() => {
          setOnboarded(true)
          navigate('home')
        }}
      />
    )
  } else if (view === 'review') {
    content = <ReviewSession levels={levels} onHome={() => navigate('home')} />
  } else if (view === 'scene' && sceneId) {
    content = <SceneView levels={levels} sceneId={sceneId} onExit={() => navigate('home')} />
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
      />
    )
  }

  return <div ref={containerRef as RefObject<HTMLDivElement>}>{content}</div>
}
