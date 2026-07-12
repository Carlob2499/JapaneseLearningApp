import { useState } from 'react'
import Home from './ui/Home'
import ReviewSession from './ui/ReviewSession'
import './App.css'

export default function App() {
  const [view, setView] = useState<'home' | 'review'>('home')
  return view === 'home' ? (
    <Home onStart={() => setView('review')} />
  ) : (
    <ReviewSession onHome={() => setView('home')} />
  )
}
