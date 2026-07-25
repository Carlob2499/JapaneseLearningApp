import { describe, it, expect } from 'vitest'
import { Classbook, LessonTemplate } from './index'

const lesson = {
  kind: 'lesson',
  id: 'lesson:quartet1:1',
  book: 'quartet1',
  lesson: 1,
  titleEn: 'Miyazaki & the Anime Craft',
  themeEn: 'Anime, craft, and how it captured the world',
  grammarIds: ['grammar:q1:to-ieba', 'grammar:l3:you-ni-naru'],
  vocabIds: ['vocab:1234567'],
  kanjiWeeks: [['短', '合', '公', '園', '酒', '機']],
  citations: [
    {
      name: 'Bunpro — Quartet I Grammar deck',
      url: 'https://bunpro.jp/decks/kyi3ss/Quartet-I-Grammar',
      retrieved: '2026-07-24',
      license: 'editorial reference — lesson placement only; prose not copied',
    },
  ],
}

describe('classbook schemas (D-034)', () => {
  it('accepts a well-formed lesson template', () => {
    expect(LessonTemplate.safeParse(lesson).success).toBe(true)
  })

  it('rejects a lesson with no grammar points', () => {
    expect(LessonTemplate.safeParse({ ...lesson, grammarIds: [] }).success).toBe(false)
  })

  it('rejects a lesson with no resolved vocab ids', () => {
    expect(LessonTemplate.safeParse({ ...lesson, vocabIds: [] }).success).toBe(false)
  })

  it('rejects a lesson with no citations (D-002 provenance gate)', () => {
    expect(LessonTemplate.safeParse({ ...lesson, citations: [] }).success).toBe(false)
  })

  it('rejects a kanji week that is not exactly six characters', () => {
    expect(LessonTemplate.safeParse({ ...lesson, kanjiWeeks: [['短', '合']] }).success).toBe(false)
  })

  it('rejects a lesson with zero kanji weeks', () => {
    expect(LessonTemplate.safeParse({ ...lesson, kanjiWeeks: [] }).success).toBe(false)
  })

  it('accepts a classbook of ordered lessons', () => {
    const book = { book: 'quartet1', lessons: [lesson] }
    expect(Classbook.safeParse(book).success).toBe(true)
    expect(Classbook.safeParse({ book: 'quartet1', lessons: [] }).success).toBe(false)
  })
})
