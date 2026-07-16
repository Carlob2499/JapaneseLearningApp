import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ChoiceCard, GrammarCard, ListeningCard, SentenceCard, SpeakButton, TypedCard } from './cards'
import type { Choice } from '../review/choices'
import type { GrammarPoint, SentenceItem } from '@hikkoshi/schemas'

afterEach(cleanup)

const choices: Choice[] = [
  { text: 'to eat', correct: true },
  { text: 'to drink', correct: false },
  { text: 'blue', correct: false },
]

function renderCard(onGrade: (o: 'pass' | 'fail' | 'partial') => void) {
  render(
    <ChoiceCard
      kind="Vocabulary"
      prompt={<span>食べる</span>}
      question="Which meaning?"
      choices={choices}
      onGrade={onGrade}
    />,
  )
}

describe('ChoiceCard', () => {
  it('renders one button per choice and the question', () => {
    renderCard(() => {})
    expect(screen.getAllByTestId('choice')).toHaveLength(3)
    expect(screen.getByText('Which meaning?')).toBeTruthy()
  })

  it('grades pass when the correct option is chosen', () => {
    const onGrade = vi.fn()
    renderCard(onGrade)
    fireEvent.click(screen.getByText('to eat'))
    fireEvent.click(screen.getByText('Next →'))
    expect(onGrade).toHaveBeenCalledWith('pass')
  })

  it('grades fail when a wrong option is chosen', () => {
    const onGrade = vi.fn()
    renderCard(onGrade)
    fireEvent.click(screen.getByText('to drink'))
    fireEvent.click(screen.getByText('Next →'))
    expect(onGrade).toHaveBeenCalledWith('fail')
  })
})

describe('ListeningCard', () => {
  function renderListening(onGrade: (o: 'pass' | 'fail' | 'partial') => void) {
    render(
      <ListeningCard
        kind="Vocabulary"
        question="Which meaning?"
        spokenText="たべる"
        revealText={<span>食べる</span>}
        choices={choices}
        onGrade={onGrade}
      />,
    )
  }

  it('prompts by ear: a replay button and choices, with the Japanese hidden until answered', () => {
    renderListening(() => {})
    expect(screen.getByRole('button', { name: /play audio/i })).toBeTruthy()
    expect(screen.getAllByTestId('choice')).toHaveLength(3)
    // The written form is withheld — the ear does the work first.
    expect(screen.queryByText('食べる')).toBeNull()
  })

  it('reveals the spoken text after a pick and grades on the correct choice', () => {
    const onGrade = vi.fn()
    renderListening(onGrade)
    fireEvent.click(screen.getByText('to eat'))
    expect(screen.getByText('食べる')).toBeTruthy() // revealed now
    fireEvent.click(screen.getByText('Next →'))
    expect(onGrade).toHaveBeenCalledWith('pass')
  })
})

describe('TypedCard', () => {
  function renderTyped(onGrade: (o: 'pass' | 'fail' | 'partial') => void) {
    render(<TypedCard kind="Vocabulary" prompt={<span>食べる</span>} answer="たべる" onGrade={onGrade} />)
  }

  it('grades pass when the typed reading matches (romaji auto-converts to kana)', () => {
    const onGrade = vi.fn()
    renderTyped(onGrade)
    fireEvent.change(screen.getByTestId('typed-input'), { target: { value: 'taberu' } })
    fireEvent.click(screen.getByText('Check'))
    fireEvent.click(screen.getByText('Next →'))
    expect(onGrade).toHaveBeenCalledWith('pass')
  })

  it('grades fail and reveals the answer when wrong', () => {
    const onGrade = vi.fn()
    renderTyped(onGrade)
    fireEvent.change(screen.getByTestId('typed-input'), { target: { value: 'みる' } })
    fireEvent.click(screen.getByText('Check'))
    expect(screen.getByTestId('typed-feedback').textContent).toContain('たべる')
    fireEvent.click(screen.getByText('Next →'))
    expect(onGrade).toHaveBeenCalledWith('fail')
  })
})

describe('SentenceCard', () => {
  function sentence(register: SentenceItem['register']): SentenceItem {
    return {
      kind: 'sentence',
      id: 'sentence:1',
      tatoebaId: 1,
      ja: '水をください。',
      en: 'Water, please.',
      attribution: { author: 'x', license: 'CC-BY-2.0-FR' },
      levelEstimate: 'L1',
      register,
      coverage: { knownRatioBasis: 'test' },
    }
  }

  it('shows a register chip labelling the sentence politeness (polite → "polite")', () => {
    render(<SentenceCard item={sentence('polite')} onGrade={() => {}} />)
    const chip = screen.getByTestId('register-chip')
    expect(chip.textContent).toBe('polite')
    expect(chip.getAttribute('data-reg')).toBe('polite')
  })

  it('collapses the two keigo values + service script to a "keigo"/"formal" group tint', () => {
    render(<SentenceCard item={sentence('keigo_humble')} onGrade={() => {}} />)
    const chip = screen.getByTestId('register-chip')
    expect(chip.textContent).toBe('keigo')
    expect(chip.getAttribute('data-reg')).toBe('keigo')
  })
})

describe('GrammarCard', () => {
  const point: GrammarPoint = {
    kind: 'grammar',
    id: 'grammar:l1:te-mo-ii',
    name: '〜てもいいです',
    level: 'L1',
    gloss: 'permission — it is OK to',
    summary: 'The te-form + もいいです asks or grants permission.',
    citations: [{ name: 'JLPT Sensei', url: 'https://x', retrieved: '2026-07-13', license: 'ref' }],
    textbookAnchors: [{ book: 'genki1', chapter: 6 }],
    examples: [{ ja: '帰ってもいいです。', en: 'You may go home.', tatoebaId: 1, attribution: { author: 'x', license: 'CC-BY-2.0-FR' } }],
  }

  it('cues with the pattern, then reveals the gloss, summary, and a verified example', () => {
    render(<GrammarCard item={point} onGrade={() => {}} />)
    expect(screen.getByText('〜てもいいです')).toBeTruthy() // pattern is the front cue
    expect(screen.queryByText('permission — it is OK to')).toBeNull() // gloss hidden until reveal
    fireEvent.click(screen.getByText('Reveal'))
    expect(screen.getByText('permission — it is OK to')).toBeTruthy()
    expect(screen.getByText('You may go home.')).toBeTruthy() // the Tatoeba example's translation
  })
})

describe('SpeakButton', () => {
  afterEach(() => vi.unstubAllGlobals())

  class FakeUtterance {
    text: string
    lang = ''
    constructor(text: string) {
      this.text = text
    }
  }

  function stubVoices(voices: Array<{ lang: string }>) {
    const speakFn = vi.fn()
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
    vi.stubGlobal('speechSynthesis', {
      getVoices: () => voices,
      speak: speakFn,
      cancel: vi.fn(),
      addEventListener: () => {},
      removeEventListener: () => {},
    })
    return speakFn
  }

  it('renders nothing when the device has no Japanese voice', () => {
    stubVoices([{ lang: 'en-US' }])
    render(<SpeakButton text="たべる" />)
    expect(screen.queryByTestId('speak')).toBeNull()
  })

  it('voices the text when clicked and a Japanese voice is present', () => {
    const speakFn = stubVoices([{ lang: 'ja-JP' }])
    render(<SpeakButton text="たべる" />)
    fireEvent.click(screen.getByTestId('speak'))
    expect(speakFn).toHaveBeenCalledTimes(1)
    expect(speakFn.mock.calls[0][0].text).toBe('たべる')
  })
})
