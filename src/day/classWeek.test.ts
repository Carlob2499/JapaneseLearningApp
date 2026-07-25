import { describe, it, expect } from 'vitest'
import type { ItemState, LessonTemplate } from '@hikkoshi/schemas'
import type { ClassSettings } from '../store/classSettings'
import { buildClassTask, lessonReadiness, phaseFor, type ClassPhase } from './classWeek'

const settings = (patch: Partial<ClassSettings> = {}): ClassSettings => ({
  enabled: true,
  book: 'quartet1',
  classDay: 3, // Wednesday
  lesson: 1,
  ...patch,
})

// 2026-07-22 is a Wednesday; the run below covers one full 7-day cycle from it.
const DAY_MS = 86_400_000
const WED = new Date('2026-07-22').getTime()
const dateAt = (offset: number) => new Date(WED + offset * DAY_MS)

describe('phaseFor', () => {
  it('is off when class mode is disabled, regardless of day', () => {
    expect(phaseFor(dateAt(0), settings({ enabled: false }))).toBe('off')
  })

  const expected: Record<number, ClassPhase> = {
    0: 'class', // Wed — class day itself
    1: 'capture', // Thu
    2: 'strengthen', // Fri
    3: 'strengthen', // Sat
    4: 'strengthen', // Sun
    5: 'seed', // Mon — 2 days before next class
    6: 'seed', // Tue — 1 day before next class
  }
  for (const [offset, phase] of Object.entries(expected)) {
    it(`is '${phase}' at ${offset} day(s) after class`, () => {
      expect(phaseFor(dateAt(Number(offset)), settings())).toBe(phase)
    })
  }

  it('cycles correctly into the following week', () => {
    expect(phaseFor(dateAt(7), settings())).toBe('class')
    expect(phaseFor(dateAt(8), settings())).toBe('capture')
  })
})

function lesson(over: Partial<LessonTemplate> = {}): LessonTemplate {
  return {
    kind: 'lesson',
    id: 'lesson:quartet1:1',
    book: 'quartet1',
    lesson: 1,
    titleEn: 'Test lesson',
    themeEn: 'Testing',
    grammarIds: ['g1', 'g2'],
    vocabIds: ['v1', 'v2'],
    kanjiWeeks: [['一', '二', '三', '四', '五', '六']],
    citations: [{ name: 'x', url: 'https://example.com', retrieved: '2026-01-01', license: 'x' }],
    ...over,
  }
}

function state(itemId: string): ItemState {
  return { itemId, stage: 1, due: 0, introducedAt: 0, lapses: 0, lastOutcomes: 0 }
}

describe('lessonReadiness', () => {
  it('is 0 when nothing has been met', () => {
    expect(lessonReadiness(lesson(), [])).toBe(0)
  })

  it('is the share of grammar+vocab ids with any progress record', () => {
    expect(lessonReadiness(lesson(), [state('g1'), state('v9')])).toBe(0.25) // 1 of 4 ids matches
  })

  it('is 1 when every id has a record', () => {
    const states = ['g1', 'g2', 'v1', 'v2'].map(state)
    expect(lessonReadiness(lesson(), states)).toBe(1)
  })
})

describe('buildClassTask', () => {
  const L = lesson()

  it('is null outside seed/capture phases', () => {
    expect(buildClassTask('off', L, [])).toBeNull()
    expect(buildClassTask('class', L, [])).toBeNull()
    expect(buildClassTask('strengthen', L, [])).toBeNull()
  })

  it('seed lists not-yet-met items and is null once everything is met', () => {
    const task = buildClassTask('seed', L, [state('g1')])
    expect(task).toEqual({ kind: 'class-seed', lessonId: L.id, itemIds: ['g2', 'v1', 'v2'] })
    const allMet = ['g1', 'g2', 'v1', 'v2'].map(state)
    expect(buildClassTask('seed', L, allMet)).toBeNull()
  })

  it('capture lists already-met items and is null when nothing has been met yet', () => {
    const task = buildClassTask('capture', L, [state('g1'), state('v1')])
    expect(task).toEqual({ kind: 'class-capture', lessonId: L.id, itemIds: ['g1', 'v1'] })
    expect(buildClassTask('capture', L, [])).toBeNull()
  })
})
