import { test, expect, startAsBeginner } from './helpers'

/**
 * Traces the current active guide stroke by sampling real points along its own path (chromium's
 * getTotalLength/getPointAtLength — the geometry jsdom lacks, which is exactly why this coverage
 * lives here and not in a unit test) and dragging through them with real mouse events. Hugging
 * the actual curve (not a straight chord) keeps this reliable against KanjiVG's curved strokes.
 */
async function traceActiveStroke(page: import('@playwright/test').Page): Promise<void> {
  const points = await page.evaluate(() => {
    const svg = document.querySelector('.trace-svg') as SVGSVGElement
    const path = svg.querySelector('.trace-guide.active') as SVGPathElement
    const rect = svg.getBoundingClientRect()
    const vb = svg.viewBox.baseVal
    const len = path.getTotalLength()
    return [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1].map((f) => {
      const p = path.getPointAtLength(len * f)
      return { x: rect.left + (p.x / vb.width) * rect.width, y: rect.top + (p.y / vb.height) * rect.height }
    })
  })
  await page.mouse.move(points[0].x, points[0].y)
  await page.mouse.down()
  for (const p of points.slice(1)) {
    await page.mouse.move(p.x, p.y)
  }
  await page.mouse.up()
  await page.waitForTimeout(100)
}

/** Traces every stroke of whichever kanji is currently open, using real geometry each time —
 *  robust to stroke count, since it just keeps going until TraceCanvas itself unmounts. */
async function traceWholeKanji(page: import('@playwright/test').Page): Promise<void> {
  for (let i = 0; i < 20; i++) {
    if ((await page.locator('.trace-svg').count()) === 0) return
    await traceActiveStroke(page)
  }
}

test.describe('kanji tracing (D-037)', () => {
  test('a real pointer-traced kanji sheet cell inks in and persists across reload', async ({ page, consoleErrors }) => {
    void consoleErrors
    await startAsBeginner(page)
    await page.locator('.class-discovery >> text=Set up').click()
    await page.locator('.classroom-toggle input').check()
    await page.getByRole('button', { name: /home/i }).click()

    await page.locator('.class-entry').click()
    await expect(page.locator('.classroom-page')).toBeVisible()
    await page.locator('.kanji-practice-open').click()

    const cells = page.locator('[data-testid="trace-cell"]')
    await expect(cells).toHaveCount(6)
    expect(await cells.nth(0).getAttribute('data-traced')).toBe('false')
    await cells.nth(0).click()

    await expect(page.locator('.trace-svg')).toBeVisible()
    await traceWholeKanji(page)

    // TraceCanvas unmounts back to the grid the instant the last stroke lands correctly.
    await expect(cells.first()).toBeVisible()
    expect(await cells.nth(0).getAttribute('data-traced')).toBe('true')

    await page.reload()
    await expect(page.locator('.life-stage-badge')).toBeVisible()
    await page.locator('.class-entry').click()
    await page.locator('.kanji-practice-open').click()
    const reloadedCells = page.locator('[data-testid="trace-cell"]')
    expect(await reloadedCells.nth(0).getAttribute('data-traced')).toBe('true')
  })
})
