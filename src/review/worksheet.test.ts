import { describe, it, expect } from 'vitest'
import type { GrammarPoint } from '@hikkoshi/schemas'
import { clozeFor, clozeIsTypeable, confusableSiblings } from './worksheet'

function point(over: Partial<GrammarPoint> = {}): GrammarPoint {
  return {
    kind: 'grammar',
    id: 'grammar:l3:you-ni-naru',
    name: '〜ようになる',
    level: 'L3',
    gloss: 'come to',
    summary: 'summary',
    citations: [{ name: 'x', url: 'https://x', retrieved: '2026-01-01', license: 'x' }],
    patterns: ['ようになりました', 'ようになる'],
    examples: [
      { ja: '毎日歩くようになりました。', en: 'I came to walk every day.', tatoebaId: 1, attribution: { author: 'a', license: 'CC-BY-2.0-FR' } },
    ],
    ...over,
  }
}

describe('clozeFor', () => {
  it('splits a real example around its longest matching pattern', () => {
    const c = clozeFor(point())
    expect(c).toEqual({
      before: '毎日歩く',
      blank: 'ようになりました',
      after: '。',
      translationEn: 'I came to walk every day.',
    })
  })

  it('reassembles to the exact verbatim sentence', () => {
    const c = clozeFor(point())!
    expect(c.before + c.blank + c.after).toBe('毎日歩くようになりました。')
  })

  it('prefers the longer of two overlapping patterns', () => {
    const c = clozeFor(point({ patterns: ['ようになる', 'ようになりました'] }))!
    expect(c.blank).toBe('ようになりました')
  })

  it('falls through to the first example that actually contains a pattern', () => {
    const p = point({
      patterns: ['てほしい'],
      examples: [
        { ja: '関係ない話。', en: 'unrelated', tatoebaId: 2, attribution: { author: 'a', license: 'CC-BY-2.0-FR' } },
        { ja: '来てほしいです。', en: 'I want you to come.', tatoebaId: 3, attribution: { author: 'a', license: 'CC-BY-2.0-FR' } },
      ],
    })
    expect(clozeFor(p)?.blank).toBe('てほしい')
  })

  it('is null when no example contains any of the point patterns (defensive; never happens for real shipped data)', () => {
    const p = point({ patterns: ['xyz'] })
    expect(clozeFor(p)).toBeNull()
  })
})

describe('clozeIsTypeable', () => {
  it('is true for a pure-hiragana blank', () => {
    expect(clozeIsTypeable(clozeFor(point())!)).toBe(true)
  })

  it('is false when the blank carries kanji (falls back to recall, no IME assumed)', () => {
    const p = point({ patterns: ['何と言っても'], examples: [{ ja: '何と言っても健康が一番だ。', en: 'Health matters most, no matter what.', tatoebaId: 4, attribution: { author: 'a', license: 'CC-BY-2.0-FR' } }] })
    expect(clozeIsTypeable(clozeFor(p)!)).toBe(false)
  })
})

describe('confusableSiblings (D-036 hybrid interleaving guard)', () => {
  it('finds another point sharing a two-character pattern prefix', () => {
    const target = point({ id: 'grammar:l1:masen', patterns: ['ませんか'] })
    const sibling = point({ id: 'grammar:l1:masenka', patterns: ['ませんでした'] })
    const stranger = point({ id: 'grammar:l1:te-mo-ii', patterns: ['てもいい'] })
    expect(confusableSiblings(target, [target, sibling, stranger])).toEqual([sibling])
  })

  it('never includes the target itself, even with an identical pattern', () => {
    const target = point({ id: 'grammar:l1:masen', patterns: ['ません'] })
    expect(confusableSiblings(target, [target])).toEqual([])
  })

  it('is empty when no other point shares a prefix', () => {
    const target = point({ id: 'grammar:l1:masen', patterns: ['ません'] })
    const stranger = point({ id: 'grammar:l1:te-mo-ii', patterns: ['てもいい'] })
    expect(confusableSiblings(target, [target, stranger])).toEqual([])
  })
})
