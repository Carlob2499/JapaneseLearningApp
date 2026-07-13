import { useState } from 'react'
import type { Level } from '@hikkoshi/schemas'
import Home from './ui/Home'
import ReviewSession from './ui/ReviewSession'
import SceneView from './ui/SceneView'
import { getActiveLevels, setActiveLevels } from './store/settings'
import './App.css'

export default function App() {
  const [view, setView] = useState<'home' | 'review' | 'scene'>('home')
  const [levels, setLevels] = useState<Level[]>(() => getActiveLevels())

  function toggleLevel(level: Level) {
    setLevels((prev) => {
      const next = prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
      return setActiveLevels(next) // persists, canonicalises, never empty
    })
  }

  if (view === 'review') return <ReviewSession levels={levels} onHome={() => setView('home')} />
  if (view === 'scene') {
    return <SceneView levels={levels} sceneId="scene:l1:konbini" onExit={() => setView('home')} />
  }
  return (
    <Home
      levels={levels}
      onToggleLevel={toggleLevel}
      onStart={() => setView('review')}
      onStartScene={() => setView('scene')}
    />
  )
}
