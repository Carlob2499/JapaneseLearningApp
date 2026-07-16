import { test, expect, startAsBeginner } from './helpers'

test.describe('journey stamp book', () => {
  test('opens from the badge and presses at least the arrival stamp', async ({ page, consoleErrors }) => {
    void consoleErrors
    await startAsBeginner(page)

    await page.locator('.life-stage-badge').click()
    await expect(page.locator('.journey-book')).toBeVisible()

    // Stage 0 (Tourist / 着) is always stamped — a fresh profile shows at least one pressed stamp.
    const stamped = page.locator('.stamp-stamped')
    expect(await stamped.count()).toBeGreaterThan(0)

    // However motion is configured, the earned stamps end up fully pressed (opacity settles to 1).
    await expect(stamped.first()).toHaveCSS('opacity', '1')

    // Under reduced motion the press is a no-op: the stamp must be there immediately, not tweened in.
    if (test.info().project.name === 'reduced') {
      const opacity = await stamped.first().evaluate((el) => getComputedStyle(el).opacity)
      expect(opacity).toBe('1')
    }
  })
})
