import { describe, it, expect, vi, afterEach } from 'vitest'
import { hasJapaneseVoice, japaneseVoice, speak } from './tts'

class FakeUtterance {
  text: string
  voice: unknown = null
  lang = ''
  rate = 1
  constructor(text: string) {
    this.text = text
  }
}

function install(voices: Array<{ lang: string; name?: string }>) {
  const speakFn = vi.fn()
  const cancelFn = vi.fn()
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
  vi.stubGlobal('speechSynthesis', {
    getVoices: () => voices,
    speak: speakFn,
    cancel: cancelFn,
    addEventListener: () => {},
    removeEventListener: () => {},
  })
  return { speakFn, cancelFn }
}

afterEach(() => vi.unstubAllGlobals())

describe('tts', () => {
  it('reports no Japanese voice when none is installed', () => {
    install([{ lang: 'en-US' }])
    expect(hasJapaneseVoice()).toBe(false)
  })

  it('finds a Japanese voice when present', () => {
    install([{ lang: 'en-US' }, { lang: 'ja-JP', name: 'Kyoko' }])
    expect(japaneseVoice()?.lang).toBe('ja-JP')
    expect(hasJapaneseVoice()).toBe(true)
  })

  it('speaks the text with the Japanese voice, cancelling any current utterance', () => {
    const { speakFn, cancelFn } = install([{ lang: 'ja-JP' }])
    speak('たべる')
    expect(cancelFn).toHaveBeenCalled()
    expect(speakFn).toHaveBeenCalledTimes(1)
    const u = speakFn.mock.calls[0][0]
    expect(u.text).toBe('たべる')
    expect(u.lang).toBe('ja-JP')
  })

  it('is a no-op when there is no Japanese voice', () => {
    const { speakFn } = install([{ lang: 'en-US' }])
    speak('たべる')
    expect(speakFn).not.toHaveBeenCalled()
  })

  it('is a no-op for empty text even with a voice', () => {
    const { speakFn } = install([{ lang: 'ja-JP' }])
    speak('   ')
    expect(speakFn).not.toHaveBeenCalled()
  })
})
