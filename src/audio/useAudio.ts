import { useEffect, useState } from 'react'
import { hasJapaneseVoice, speak } from './tts'

/**
 * Audio capability + a speak fn for components. `available` flips to true once a Japanese
 * voice loads (voices populate asynchronously, firing `voiceschanged`), so audio UI can
 * appear as soon as the platform is ready — and stays hidden where no voice exists.
 */
export function useAudio(): { available: boolean; speak: (text: string) => void } {
  const [available, setAvailable] = useState<boolean>(() => hasJapaneseVoice())
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const s = window.speechSynthesis
    const update = () => setAvailable(hasJapaneseVoice())
    s.addEventListener('voiceschanged', update)
    update()
    return () => s.removeEventListener('voiceschanged', update)
  }, [])
  return { available, speak }
}
