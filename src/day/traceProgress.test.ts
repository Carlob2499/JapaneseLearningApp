import { describe, it, expect } from 'vitest'
import type { JournalEntry, LessonTemplate, StrokeItem } from '@hikkoshi/schemas'
import { isSheetComplete, isTraced, kanjiWeekFor } from './traceProgress'

function stroke(literal: string): StrokeItem {
  return {
    kind: 'strokes',
    id: `strokes:${literal}`,
    literal,
    level: 'L1',
    kanjivgId: literal,
    viewBox: '0 0 109 109',
    strokes: ['M1,1'],
    strokeCount: 1,
  }
}

function traceEntry(itemId: string, outcome: JournalEntry['outcome'] = 'pass'): JournalEntry {
  return { itemId, ts: 1, interaction: 'trace', outcome }
}

describe('isTraced', () => {
  it('is true once a pass trace entry exists for the item', () => {
    expect(isTraced('strokes:力', [traceEntry('strokes:力')])).toBe(true)
  })

  it('is false with no matching entry', () => {
    expect(isTraced('strokes:力', [traceEntry('strokes:画')])).toBe(false)
  })

  it('ignores entries of a different interaction (e.g. a review, not a trace)', () => {
    const reviewEntry: JournalEntry = { itemId: 'strokes:力', ts: 1, interaction: 'recall', outcome: 'pass' }
    expect(isTraced('strokes:力', [reviewEntry])).toBe(false)
  })

  it('ignores a failed trace attempt', () => {
    expect(isTraced('strokes:力', [traceEntry('strokes:力', 'fail')])).toBe(false)
  })
})

describe('isSheetComplete', () => {
  const byLiteral = new Map([stroke('力'), stroke('画')].map((s) => [s.literal, s]))

  it('is true once every character has a pass trace entry', () => {
    const journal = [traceEntry('strokes:力'), traceEntry('strokes:画')]
    expect(isSheetComplete(['力', '画'], byLiteral, journal)).toBe(true)
  })

  it('is false when one character is still untraced', () => {
    expect(isSheetComplete(['力', '画'], byLiteral, [traceEntry('strokes:力')])).toBe(false)
  })

  it('treats a literal with no stroke data as not complete, rather than throwing', () => {
    expect(isSheetComplete(['力', '未知'], byLiteral, [traceEntry('strokes:力')])).toBe(false)
  })
})

describe('kanjiWeekFor', () => {
  const lesson: LessonTemplate = {
    kind: 'lesson',
    id: 'lesson:quartet1:2',
    book: 'quartet1',
    lesson: 2,
    titleEn: 'x',
    themeEn: 'x',
    vocabIds: ['vocab:x'],
    grammarIds: ['grammar:x'],
    kanjiWeeks: [['力', '画', '能', '想', '映', '努']],
    citations: [{ name: 'x', url: 'https://x', retrieved: '2026-01-01', license: 'x' }],
  }

  it('uses the shipped default when this is not the current lesson', () => {
    expect(kanjiWeekFor(lesson, 1, ['a', 'b', 'c', 'd', 'e', 'f'])).toEqual(lesson.kanjiWeeks[0])
  })

  it('uses the override when this is the current lesson and an override exists', () => {
    const mine = ['甲', '乙', '丙', '丁', '戊', '己']
    expect(kanjiWeekFor(lesson, 2, mine)).toEqual(mine)
  })

  it('falls back to the default when this is the current lesson but there is no override', () => {
    expect(kanjiWeekFor(lesson, 2, undefined)).toEqual(lesson.kanjiWeeks[0])
  })
})
