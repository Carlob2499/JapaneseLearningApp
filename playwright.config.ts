import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end smoke suite (D-027). Runs against `vite preview` of the built `dist/` — the exact
 * bytes that deploy to GitHub Pages, not the dev server — so a green run means the shipped
 * bundle works, service worker, base path, bundled L0/L1 packs and all.
 *
 * Three projects cover the app's non-negotiable rendering axes (D-019/D-026): light scheme, dark
 * scheme, and reduced motion. Every spec attaches a console-error listener; zero console errors
 * is part of the pass bar, matching every interactive verification pass to date.
 *
 * Local runs reuse the pre-installed browser via PW_EXECUTABLE_PATH (the remote environment pins
 * a browser build that `playwright install` must not re-fetch); CI leaves it unset and uses the
 * browser it installs itself.
 */
const executablePath = process.env.PW_EXECUTABLE_PATH || undefined

// vite preview serves the app under its Pages base path; tests navigate with `page.goto('./')`.
const BASE_URL = 'http://localhost:4173/JapaneseLearningApp/'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: BASE_URL,
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure',
    launchOptions: { executablePath },
  },
  projects: [
    {
      name: 'light',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, colorScheme: 'light' },
    },
    {
      name: 'dark',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, colorScheme: 'dark' },
    },
    {
      name: 'reduced',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        reducedMotion: 'reduce',
      },
    },
  ],
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
