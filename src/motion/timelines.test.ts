import { describe, it, expect } from 'vitest'
import { ambientDrift, celebrate, enterTimeline, exitTimeline, gentleSway, hankoPop, pulsePass, shakeFail, staggerIn, stampPress, strokeDrawIn, traceInk, traceWrong } from './timelines'

function div(): HTMLDivElement {
  return document.createElement('div')
}

// The test environment's matchMedia stub always reports reduced motion on (D-019), so every
// factory here is exercised on its reduced-motion branch — the collapsed, near-instant shape.
describe('motion timeline factories (reduced-motion branch)', () => {
  it('enterTimeline collapses to a short, motionless fade', () => {
    const tw = enterTimeline(div())
    expect(tw.duration()).toBeCloseTo(0.15)
    expect(tw.vars.y).toBe(0)
  })

  it('exitTimeline collapses to a short, motionless fade', () => {
    const tw = exitTimeline(div())
    expect(tw.duration()).toBeCloseTo(0.15)
    expect(tw.vars.y).toBe(0)
  })

  it('staggerIn drops its stagger delay entirely', () => {
    const tw = staggerIn([div(), div(), div()])
    expect(tw.duration()).toBeCloseTo(0.15)
    expect(tw.vars.stagger).toBe(0)
  })

  it('pulsePass becomes a zero-duration no-op', () => {
    const tw = pulsePass(div())
    expect(tw.duration()).toBe(0)
  })

  it('shakeFail becomes a zero-duration no-op', () => {
    const tw = shakeFail(div())
    expect(tw.duration()).toBe(0)
  })

  it('celebrate settles instantly without the elastic overshoot', () => {
    const tw = celebrate(div())
    expect(tw.duration()).toBeCloseTo(0.15)
    expect(tw.vars.ease).toBe('power2.out')
  })

  it('ambientDrift (Ken Burns) holds a photo perfectly still', () => {
    const tw = ambientDrift(div())
    expect(tw.duration()).toBe(0)
    expect(tw.vars.repeat).toBeUndefined() // no infinite loop is ever created under reduced motion
  })

  it('gentleSway keeps hanging accents still', () => {
    const tw = gentleSway(div())
    expect(tw.duration()).toBe(0)
    expect(tw.vars.repeat).toBeUndefined()
  })

  it('stampPress places stamps instantly, with no stagger and no press', () => {
    const tw = stampPress([div(), div()])
    expect(tw.duration()).toBe(0)
    expect(tw.vars.stagger).toBeUndefined()
    expect(tw.delay()).toBe(0)
  })

  it('hankoPop shows the maru instantly, and never touches drawSVG (the jsdom law)', () => {
    const tl = hankoPop(div())
    expect(tl.duration()).toBe(0)
    for (const child of tl.getChildren()) {
      expect((child.vars as Record<string, unknown>).drawSVG).toBeUndefined()
    }
  })

  it('strokeDrawIn renders the chart instantly, and never touches drawSVG (the jsdom law)', () => {
    const tw = strokeDrawIn([div(), div()])
    expect(tw.duration()).toBe(0)
    expect((tw.vars as Record<string, unknown>).drawSVG).toBeUndefined()
    expect(tw.vars.stagger).toBeUndefined()
  })

  it('traceInk inks a traced stroke in instantly, and never touches drawSVG (the jsdom law)', () => {
    const tw = traceInk(div())
    expect(tw.duration()).toBe(0)
    expect((tw.vars as Record<string, unknown>).drawSVG).toBeUndefined()
  })

  it('traceWrong holds the guide still — a genuinely empty timeline', () => {
    const tl = traceWrong(div())
    expect(tl.duration()).toBe(0)
    expect(tl.getChildren().length).toBe(0)
  })
})
