import { describe, it, expect } from 'vitest'
import { buildChoices, buildPhraseChoices, buildPools, retrievalModeFor, type Pools } from './choices'
import type { Content } from '../content/packs'
import type { Reviewable } from './useReview'

/** Deterministic rng in [0, 1) so shuffles are stable across runs. */
function lcg(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0
    return s / 0x100000000
  }
}

function vocab(id: string, expression: string, glosses: string[][]): Extract<Reviewable, { kind: 'vocab' }> {
  return {
    id,
    kind: 'vocab',
    item: {
      kind: 'vocab',
      id,
      jmdictSeq: 1,
      expression,
      reading: 'かな',
      senses: glosses.map((g) => ({ gloss: g, pos: [] })),
      level: 'L1',
      modules: [],
    },
  }
}

function kanji(id: string, literal: string, meanings: string[]): Extract<Reviewable, { kind: 'kanji' }> {
  return {
    id,
    kind: 'kanji',
    item: {
      kind: 'kanji',
      id,
      literal,
      level: 'L1',
      strokes: { kanjivgId: '00000' },
      readingsOn: [],
      readingsKun: [],
      meanings,
    },
  }
}

function sentence(id: string, ja: string, en: string): Extract<Reviewable, { kind: 'sentence' }> {
  return {
    id,
    kind: 'sentence',
    item: {
      kind: 'sentence',
      id,
      tatoebaId: 1,
      ja,
      en,
      attribution: { author: 'x', license: 'CC-BY-2.0-FR' },
      levelEstimate: 'L1',
      register: 'polite',
      coverage: { knownRatioBasis: 'test' },
    },
  }
}

function grammar(id: string, name: string, gloss: string): Extract<Reviewable, { kind: 'grammar' }> {
  return {
    id,
    kind: 'grammar',
    item: {
      kind: 'grammar',
      id,
      name,
      level: 'L1',
      gloss,
      summary: 'summary',
      citations: [{ name: 'src', url: 'https://x', retrieved: '2026-07-13', license: 'ref' }],
      examples: [{ ja: 'れい。', en: 'example', tatoebaId: 1, attribution: { author: 'x', license: 'CC-BY-2.0-FR' } }],
    },
  }
}

const pools: Pools = {
  vocabGloss: ['to eat', 'to drink', 'blue', 'red', 'to go', 'to come', 'water', 'fire'],
  vocabWord: ['食べる', '飲む', '青', '赤', '行く', '来る', '水', '火'],
  kanjiMeaning: ['one', 'two', 'three', 'below', 'above', 'tree', 'river', 'mountain'],
  kanjiLiteral: ['一', '二', '三', '下', '上', '木', '川', '山'],
  kanaRomaji: ['a', 'i', 'u', 'e', 'o', 'ka', 'shi'],
  grammarGloss: ['permission', 'prohibition', 'obligation', 'desire', 'intention'],
  sentenceEn: ["I'm going.", 'No way!', 'You can search me!', 'It is raining.', 'Good morning.'],
}

describe('retrievalModeFor', () => {
  it('escalates per kind: recognition → production → typed (vocab) → recall', () => {
    // vocab has the full ladder
    expect(retrievalModeFor('vocab', 0)).toBe('recognition')
    expect(retrievalModeFor('vocab', 1)).toBe('recognition')
    expect(retrievalModeFor('vocab', 2)).toBe('production')
    expect(retrievalModeFor('vocab', 4)).toBe('typed')
    expect(retrievalModeFor('vocab', 5)).toBe('typed')
    expect(retrievalModeFor('vocab', 6)).toBe('recall')
    // kanji skip typed (ambiguous readings) → recall at 4+
    expect(retrievalModeFor('kanji', 3)).toBe('production')
    expect(retrievalModeFor('kanji', 4)).toBe('recall')
    // sentences have no production/typed form
    expect(retrievalModeFor('sentence', 2)).toBe('recognition')
    expect(retrievalModeFor('sentence', 5)).toBe('recall')
    // grammar behaves like sentences: recognition until recall at 4+, never production/typed
    expect(retrievalModeFor('grammar', 3)).toBe('recognition')
    expect(retrievalModeFor('grammar', 4)).toBe('recall')
  })

  it('forces varied modes for a leech, cycling by seed instead of the stage default', () => {
    // A mature vocab leech would normally be recall; forced variety cycles the seed.
    const seen = new Set(
      [0, 1, 2, 3].map((seed) => retrievalModeFor('vocab', 6, { leech: true, seed })),
    )
    expect(seen.size).toBeGreaterThan(1) // not "more of the same"
    // Sentences only have two modes to vary between.
    expect(retrievalModeFor('sentence', 6, { leech: true, seed: 0 })).toBe('recognition')
    expect(retrievalModeFor('sentence', 6, { leech: true, seed: 1 })).toBe('recall')
  })
})

describe('buildChoices', () => {
  it('makes a 4-way recognition set: one real correct gloss, real distractors, no dupes', () => {
    const choices = buildChoices(vocab('vocab:1', '食べる', [['to eat']]), 'recognition', pools, {
      count: 4,
      rng: lcg(1),
    })
    expect(choices).toHaveLength(4)
    expect(choices.filter((c) => c.correct)).toHaveLength(1)
    expect(choices.find((c) => c.correct)?.text).toBe('to eat')
    for (const c of choices) expect(pools.vocabGloss.includes(c.text)).toBe(true)
    expect(new Set(choices.map((c) => c.text)).size).toBe(choices.length)
  })

  it('answers a grammar card with its function gloss, distractors from other glosses', () => {
    const choices = buildChoices(grammar('grammar:1', '〜てもいいです', 'permission'), 'recognition', pools, {
      count: 4,
      rng: lcg(4),
    })
    expect(choices.find((c) => c.correct)?.text).toBe('permission')
    for (const c of choices) expect(pools.grammarGloss.includes(c.text)).toBe(true)
    expect(new Set(choices.map((c) => c.text)).size).toBe(choices.length)
  })

  it('answers a vocab production card with the Japanese word', () => {
    const choices = buildChoices(vocab('vocab:2', '食べる', [['to eat']]), 'production', pools, {
      rng: lcg(2),
    })
    expect(choices.find((c) => c.correct)?.text).toBe('食べる')
    for (const c of choices.filter((c) => !c.correct)) {
      expect(pools.vocabWord.includes(c.text)).toBe(true)
      expect(c.text).not.toBe('食べる')
    }
  })

  it('answers a kanji production card with the character', () => {
    const choices = buildChoices(kanji('kanji:一', '一', ['one']), 'production', pools, { rng: lcg(7) })
    expect(choices).toHaveLength(4)
    expect(choices.find((c) => c.correct)?.text).toBe('一')
    for (const c of choices) expect(pools.kanjiLiteral.includes(c.text)).toBe(true)
  })

  it('answers a sentence card with the English translation', () => {
    const choices = buildChoices(sentence('sentence:1', '行くよ。', "I'm going."), 'recognition', pools, {
      rng: lcg(3),
    })
    expect(choices.find((c) => c.correct)?.text).toBe("I'm going.")
    for (const c of choices.filter((c) => !c.correct)) {
      expect(pools.sentenceEn.includes(c.text)).toBe(true)
    }
  })

  it("never offers one of the item's own glosses (or the answer) as a distractor", () => {
    const local: Pools = { ...pools, vocabGloss: ['blue', 'green', 'to eat', 'water', 'fire'] }
    const choices = buildChoices(vocab('vocab:青', '青', [['blue'], ['green']]), 'recognition', local, {
      count: 4,
      rng: lcg(9),
    })
    const distractors = choices.filter((c) => !c.correct).map((c) => c.text)
    expect(distractors).not.toContain('green') // the item's other sense
    expect(distractors).not.toContain('blue') // the correct answer
  })

  it('degrades to fewer options when the pool is thin, keeping exactly one correct', () => {
    const thin: Pools = { ...pools, kanjiMeaning: ['one', 'two'] }
    const choices = buildChoices(kanji('kanji:一', '一', ['one']), 'recognition', thin, {
      count: 4,
      rng: lcg(5),
    })
    expect(choices).toHaveLength(2) // 1 correct + the single usable distractor
    expect(choices.filter((c) => c.correct)).toHaveLength(1)
    expect(choices.find((c) => !c.correct)?.text).toBe('two')
  })
})

describe('buildPhraseChoices', () => {
  const lines = [
    'いらっしゃいませ。',
    '温めますか。',
    'レジ袋はご利用ですか。',
    'ありがとうございました。',
    'またお越しくださいませ。',
  ]

  it('offers the correct cited line plus real distractors drawn from the phrase pool', () => {
    const choices = buildPhraseChoices('温めますか。', lines, { count: 4, rng: lcg(1) })
    expect(choices).toHaveLength(4)
    expect(choices.filter((c) => c.correct)).toHaveLength(1)
    expect(choices.find((c) => c.correct)?.text).toBe('温めますか。')
    for (const c of choices) expect(lines.includes(c.text)).toBe(true)
    expect(new Set(choices.map((c) => c.text)).size).toBe(choices.length)
  })

  it('never repeats the correct line as a distractor', () => {
    const choices = buildPhraseChoices('温めますか。', lines, { count: 4, rng: lcg(9) })
    expect(choices.filter((c) => c.text === '温めますか。')).toHaveLength(1)
  })

  it('degrades to fewer options when the pool is thin, keeping exactly one correct', () => {
    const choices = buildPhraseChoices('温めますか。', ['温めますか。', 'いらっしゃいませ。'], {
      count: 4,
      rng: lcg(5),
    })
    expect(choices).toHaveLength(2) // correct + the single distinct distractor
    expect(choices.filter((c) => c.correct)).toHaveLength(1)
    expect(choices.find((c) => !c.correct)?.text).toBe('いらっしゃいませ。')
  })
})

describe('buildPools', () => {
  it('harvests the primary gloss / meaning / literal / translation of each item', () => {
    const content: Content = {
      vocab: [vocab('v1', '食べる', [['to eat', 'to consume']]).item, vocab('v2', '飲む', [['to drink']]).item],
      kanji: [kanji('k1', '一', ['one', 'first']).item, kanji('k2', '二', ['two']).item],
      kana: [],
      grammar: [grammar('g1', '〜てもいい', 'permission').item, grammar('g2', '〜たい', 'desire').item],
      sentences: [sentence('s1', '行くよ。', "I'm going.").item],
      phrases: [],
      scenes: [],
      strokesById: new Map(),
    }
    const p = buildPools(content)
    expect(p.vocabGloss).toEqual(['to eat', 'to drink'])
    expect(p.vocabWord).toEqual(['食べる', '飲む'])
    expect(p.kanjiMeaning).toEqual(['one', 'two'])
    expect(p.kanjiLiteral).toEqual(['一', '二'])
    expect(p.grammarGloss).toEqual(['permission', 'desire'])
    expect(p.sentenceEn).toEqual(["I'm going."])
  })
})
