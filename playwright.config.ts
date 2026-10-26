import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 4173);

// Fallback for networks that block the Playwright browser download:
// set PW_CHANNEL=chrome (or msedge) to use the browser already installed on your machine.
const channel = process.env.PW_CHANNEL;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], ...(channel ? { channel } : {}) },
    },
  ],

  // Playwright starts the demo page server before the tests and stops it afterwards.
  webServer: {
    command: 'node demo/server.mjs',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    env: { PORT: String(PORT) },
  },
});
