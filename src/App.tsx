import { useState } from 'react'
import type { Level } from '@hikkoshi/schemas'
import Home from './ui/Home'
import Onboarding from './ui/Onboarding'
import ReviewSession from './ui/ReviewSession'
import SceneView from './ui/SceneView'
import { getActiveLevels, getOnboarded, setActiveLevels, setOnboarded } from './store/settings'
import './App.css'

export default function App() {
  const [view, setView] = useState<'onboarding' | 'home' | 'review' | 'scene'>(() =>
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

  if (view === 'onboarding') {
    return (
      <Onboarding
        onContinue={() => {
          setOnboarded(true)
          setView('home')
        }}
      />
    )
  }
  if (view === 'review') return <ReviewSession levels={levels} onHome={() => setView('home')} />
  if (view === 'scene' && sceneId) {
    return <SceneView levels={levels} sceneId={sceneId} onExit={() => setView('home')} />
  }
  return (
    <Home
      levels={levels}
      onToggleLevel={toggleLevel}
      onStart={() => setView('review')}
      onStartScene={(id) => {
        setSceneId(id)
        setView('scene')
      }}
    />
  )
}
