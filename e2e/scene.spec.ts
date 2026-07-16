import { test, expect, startAsBeginner } from './helpers'

test.describe('scene (konbini errand)', () => {
  test('plays through framing to a correct pick with the green fill', async ({ page, consoleErrors }) => {
    void consoleErrors
    await startAsBeginner(page)

    await page.locator('.errand-tile', { hasText: 'Konbini checkout' }).click()
    await expect(page.locator('.scene-photo img')).toBeVisible()

    // Framing steps sit behind a continue button before the first interaction beat.
    for (let i = 0; i < 8; i++) {
      if (await page.locator('[data-testid="choice"]').count()) break
      const cont = page.locator('.scene-continue-btn')
      if (await cont.count()) await cont.first().click()
      await page.waitForTimeout(300)
    }

    await page.waitForSelector('[data-testid="choice"]', { timeout: 30_000 })
    const correct = page.locator('[data-testid="choice"][data-correct="true"]').first()
    await correct.click()

    // Regression pin (D-026): the scene's ticket restyle must not out-cascade the correct fill —
    // the picked correct option must render the --ok success token, not the paper background it
    // silently fell back to before the fix. Resolved from the live token so it holds in both
    // schemes (--ok differs light vs dark).
    const picked = page.locator('.scene-view .choice.correct').first()
    await expect(picked).toBeVisible()
    const expectedOk = await page.evaluate(() => {
      const hex = getComputedStyle(document.documentElement).getPropertyValue('--ok').trim()
      const h = hex.replace('#', '')
      const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
      const r = parseInt(full.slice(0, 2), 16)
      const g = parseInt(full.slice(2, 4), 16)
      const b = parseInt(full.slice(4, 6), 16)
      return `rgb(${r}, ${g}, ${b})`
    })
    await expect(picked).toHaveCSS('background-color', expectedOk)
  })

  test('can be left back to Home', async ({ page, consoleErrors }) => {
    void consoleErrors
    await startAsBeginner(page)
    await page.locator('.errand-tile', { hasText: 'Konbini checkout' }).click()
    await expect(page.locator('.scene-photo img')).toBeVisible()
    await page.getByRole('button', { name: /leave errand/i }).click()
    await expect(page.locator('.home-hero')).toBeVisible()
  })
})
