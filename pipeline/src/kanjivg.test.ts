import { describe, it, expect } from 'vitest'
import { parseStrokeSvg } from './kanjivg'

// Trimmed real KanjiVG structure for 水 (06c34): StrokePaths group + a StrokeNumbers group.
const SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="109" height="109" viewBox="0 0 109 109">
<g id="kvg:StrokePaths_06c34" style="fill:none;stroke:#000000;stroke-width:3">
<g id="kvg:06c34" kvg:element="水">
<path id="kvg:06c34-s1" kvg:type="㇚" d="M52.77,15.08c1.08,1.08,1.67,2.49,1.76,5.52"/>
<path id="kvg:06c34-s2" kvg:type="㇇" d="M17.5,45.75c1.75,0.62,3.73,0.43,5.25,0"/>
<path id="kvg:06c34-s3" kvg:type="㇒" d="M81.22,27.5c-0.22,1.25-0.72,2.25-1.52,2.97"/>
<path id="kvg:06c34-s4" kvg:type="㇏" d="M57,46c8.82,10.73,19.23,21.46,28.42,27.42"/>
</g>
</g>
<g id="kvg:StrokeNumbers_06c34" style="font-size:8"><text transform="matrix(1 0 0 1 46 14)">1</text></g>
</svg>`

describe('parseStrokeSvg', () => {
  it('extracts ordered stroke paths and the canvas', () => {
    const { viewBox, strokes, strokeCount } = parseStrokeSvg(SVG)
    expect(viewBox).toBe('0 0 109 109')
    expect(strokeCount).toBe(4)
    expect(strokes[0]).toBe('M52.77,15.08c1.08,1.08,1.67,2.49,1.76,5.52')
    expect(strokes[3]).toBe('M57,46c8.82,10.73,19.23,21.46,28.42,27.42')
  })

  it('ignores StrokeNumbers text and orders by stroke number regardless of source order', () => {
    const shuffled = SVG.replace(
      /(<path id="kvg:06c34-s1"[^/]*\/>)\n(<path id="kvg:06c34-s2"[^/]*\/>)/,
      '$2\n$1',
    )
    const { strokes, strokeCount } = parseStrokeSvg(shuffled)
    expect(strokeCount).toBe(4)
    expect(strokes[0]).toContain('M52.77,15.08') // s1 still first after sort
  })
})
