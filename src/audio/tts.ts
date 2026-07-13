// Browser text-to-speech (Web Speech API) for Japanese pronunciation. D-002-safe: it voices
// the already dataset-verified text and generates no content. Degrades to a no-op (and, via
// hasJapaneseVoice, no UI) when the platform has no Japanese voice.

function synth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null
}

/** A Japanese voice if the platform provides one, else null. Voices load async (voiceschanged). */
export function japaneseVoice(): SpeechSynthesisVoice | null {
  const s = synth()
  if (!s) return null
  const voices = s.getVoices()
  return voices.find((v) => v.lang === 'ja-JP') ?? voices.find((v) => v.lang.startsWith('ja')) ?? null
}

/** Whether Japanese speech is available on this device right now. */
export function hasJapaneseVoice(): boolean {
  return japaneseVoice() !== null
}

/** Speak `text` in Japanese, cancelling any in-progress utterance. No-op if unavailable/empty. */
export function speak(text: string): void {
  const s = synth()
  const voice = japaneseVoice()
  if (!s || !voice || text.trim() === '') return
  s.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.voice = voice
  utterance.lang = voice.lang
  utterance.rate = 0.9 // a touch slower — clearer for learners
  s.speak(utterance)
}
