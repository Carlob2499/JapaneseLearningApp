import { test as base, expect, type Page } from '@playwright/test'

/**
 * Shared e2e scaffolding (D-027). Every spec uses this `test`, which attaches a console-error +
 * pageerror listener and, in teardown, fails the test if anything was logged — the zero-console-
 * error bar that every interactive verification pass has held to, now enforced automatically.
 *
 * A page that navigates via GSAP view transitions must never be driven with a frozen clock (that
 * freezes GSAP's ticker); these specs never touch `page.clock`, so the real flows run normally.
 */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = []
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text())
    })
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
    await use(errors)
    expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([])
  },
})

export { expect }

/** Open the app at its Pages base path and wait for the first screen to settle. */
export async function openApp(page: Page): Promise<void> {
  await page.goto('./')
  await page.waitForSelector('.shell', { state: 'visible' })
}

/** Onboarding → beginner start → Home ready (life-stage badge visible). The fast, seed-free path. */
export async function startAsBeginner(page: Page): Promise<void> {
  await openApp(page)
  await page.getByRole('button', { name: /start at the beginning/i }).click()
  await page.waitForSelector('.life-stage-badge', { timeout: 30_000 })
}

/**
 * Onboarding → placement probe answered correctly `PROBE_LENGTH` times → Home ready. Seeds a
 * placed profile (all stamps pressed), so it's the heavier path — used only where a placed
 * profile is the thing under test.
 */
export async function placeViaProbe(page: Page): Promise<void> {
  await openApp(page)
  await page.getByRole('button', { name: /studied before/i }).click()
  await page.waitForSelector('[data-testid="choice"]', { timeout: 30_000 })
  for (let i = 0; i < 8; i++) {
    await page.locator('[data-testid="choice"][data-correct="true"]').first().click()
    await page.getByRole('button', { name: /next/i }).click()
    // Either the next question or the placing spinner; give the card a beat to swap.
    await page.waitForTimeout(200)
  }
  await page.waitForSelector('.life-stage-badge', { timeout: 120_000 })
}
