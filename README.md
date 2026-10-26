# Accessibility testing with Playwright + axe-core

A small, runnable sample for our knowledge-transfer session. It has:

- a **demo page** (`demo/index.html`) with deliberate accessibility bugs,
- **working Playwright tests** that run axe-core and assert on the results,
- a **live-coding walkthrough** (Part 2 below) where you write your own test,
- an **exercise** ([`EXERCISE.md`](EXERCISE.md)) to extend it afterwards.

You do **not** need any existing app, account, or prior Playwright experience.

> Each step ends with a ✅ **Checkpoint**. If your screen doesn't match, check
> [Troubleshooting](#troubleshooting), then raise your hand or post in [our session chat channel].

---

## Part 1: Setup (about 5 minutes, mostly waiting on downloads)

### Step 0: Prerequisites

You need:

| Tool | Version | Check with |
|---|---|---|
| Node.js | 20 or newer (22 LTS recommended) | `node -v` |
| npm | comes with Node | `npm -v` |
| Git | any recent version (optional: you can download a zip instead) | `git --version` |
| A code editor | VS Code recommended | |

Don't have Node? Install the LTS version from <https://nodejs.org>, then **close and reopen your terminal**.

✅ **Checkpoint 0:** `node -v` prints `v20.x` or higher.

### Step 1: Get the project

**Option A, Git:**

```bash
git clone [REPO URL] a11y-playwright-demo
```

```bash
cd a11y-playwright-demo
```

**Option B, zip:** download it from [SHARED DRIVE / REPO URL], unzip it, and open a terminal in the unzipped `a11y-playwright-demo` folder.

✅ **Checkpoint 1:** running `ls` (macOS/Linux/PowerShell) or `dir` (cmd) shows `package.json`, `playwright.config.ts`, `demo` and `tests`.

### Step 2: Install the npm packages

```bash
npm install
```

This installs `@playwright/test` (test runner + browser driver) and `@axe-core/playwright` (the accessibility engine). It takes about 10–30 seconds.

✅ **Checkpoint 2:** the output ends with something like `added 7 packages` and **no** `ERR!` lines. A `node_modules` folder now exists.

### Step 3: Download the test browser

```bash
npx playwright install chromium
```

This downloads a Playwright-managed Chromium (about 120 MB, so it can take a minute or two on conference Wi-Fi). Linux users: use `npx playwright install --with-deps chromium` to get system libraries too.

✅ **Checkpoint 3:** the last line says Chromium (or "Chrome Headless Shell") was `downloaded to ...`.

> **Download blocked by a proxy or firewall?** Skip this step and use the Chrome or Edge
> you already have. Set `PW_CHANNEL` before running tests (see [Troubleshooting](#troubleshooting)).

### Step 4: Run the tests

```bash
npx playwright test
```

Playwright starts the demo page on `http://localhost:4173`, opens Chromium headlessly, runs axe-core and shuts everything down.

✅ **Checkpoint 4:** you see **`5 passed`**:

```
  ok 1 [chromium] › tests\01-first-scan.spec.ts › axe finds the deliberate violations on the demo page
  ok 2 [chromium] › tests\01-first-scan.spec.ts › the About section has no accessibility violations
  ok 3 [chromium] › tests\02-team-patterns.spec.ts › attach the full axe report to the Playwright HTML report
  ok 4 [chromium] › tests\02-team-patterns.spec.ts › gate on impact: only critical and serious issues fail the build
  ok 5 [chromium] › tests\02-team-patterns.spec.ts › baseline: no violations beyond the known, ticketed ones

  5 passed (3.5s)
```

(Order and timings vary, which is fine.)

### Step 5: Look at the page and the report

```bash
npm run report
```

This opens the HTML report. Click **"attach the full axe report…"** and open the `axe-results` attachment to see the raw axe output. Press `Ctrl+C` in the terminal to close the report server.

To see the demo page itself:

```bash
npm run serve
```

Then open <http://localhost:4173>. You can leave it running (tests reuse it), or press `Ctrl+C` to stop it.

✅ **Checkpoint 5:** you can see the "Create your account" page in your browser.

🎉 **Setup done.** Wait here for the hands-on segment.

---

## Part 2: Write your first axe test (live-coding walkthrough)

We'll build `tests/my-first-a11y.spec.ts` together, one step at a time. Run it on its own with:

```bash
npx playwright test my-first
```

### Step A: Scan the page and print what axe finds

Create `tests/my-first-a11y.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('my first accessibility scan', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  for (const v of results.violations) {
    console.log(`${v.id} | ${v.impact} | ${v.nodes.length} element(s) | ${v.helpUrl}`);
  }
});
```

✅ **Checkpoint A:** `1 passed`, and six lines are printed: `button-name`, `color-contrast`, `html-has-lang`, `image-alt`, `label`, `link-name`.

*Why it passes: we haven't asserted anything yet. axe found problems, but nothing told the test to fail.*

### Step B: Make it a real test

Add this line at the end of the test, just before the closing `});`:

```ts
  expect(results.violations).toEqual([]);
```

✅ **Checkpoint B:** `1 failed`, with a very long diff. **This is correct.** The page really is broken.

### Step C: Make the failure readable

Replace the assertion you just added with:

```ts
  expect(summarizeViolations(results)).toEqual([]);
```

and add this import at the top of the file:

```ts
import { summarizeViolations } from './helpers/summarize';
```

✅ **Checkpoint C:** still `1 failed`, but now the diff is six readable lines, e.g.
`image-alt [critical] Images must have alternative text (1 element: img[width="40"])`.
The part in brackets is a CSS selector for the failing element, so you can find it in the HTML.

### Step D: Fix a bug and watch the test respond

In `demo/index.html`, change `<html>` to `<html lang="en">`. Save and re-run.

✅ **Checkpoint D:** still failing, but `html-has-lang` is gone. **Five** lines remain.

*Heads-up: the provided test `01-first-scan` expects `html-has-lang` to be present, so it will now fail on a full run. That's the point of a regression test (it noticed the page changed), and you'll update it in the exercise.*

### Step E: Scope the scan to a component

Change the builder to scan only the About section:

```ts
  const results = await new AxeBuilder({ page })
    .include('#about')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
```

✅ **Checkpoint E:** `1 passed`. That's a real, passing accessibility test you wrote yourself.

> Finished early? Start on [`EXERCISE.md`](EXERCISE.md).

---

## What's in the project

```
a11y-playwright-demo/
├── demo/
│   ├── index.html          # demo page with deliberate bugs (listed in the comment at the top)
│   ├── logo.svg
│   └── server.mjs          # zero-dependency static server (npm run serve)
├── tests/
│   ├── 01-first-scan.spec.ts      # beginner: scan, assert on rule ids, scoped scan
│   ├── 02-team-patterns.spec.ts   # intermediate: fixture, report attachment, impact gate, baseline
│   ├── fixtures.ts                # shared AxeBuilder fixture with our WCAG tags
│   └── helpers/summarize.ts       # readable violation summaries
├── .github/workflows/a11y.yml     # example CI job
├── playwright.config.ts
├── EXERCISE.md
└── package.json
```

### Useful commands

| Command | What it does |
|---|---|
| `npm test` | run all tests (same as `npx playwright test`) |
| `npm run test:ui` | Playwright UI mode: watch tests, time-travel through steps |
| `npm run test:headed` | run with a visible browser window |
| `npm run report` | open the last HTML report |
| `npm run serve` | serve the demo page on http://localhost:4173 |

### Key APIs used

| API | Purpose |
|---|---|
| `new AxeBuilder({ page })` | create an axe scan for a Playwright page |
| `.withTags([...])` | only run rules for these standards (e.g. `wcag2aa`) |
| `.include(selector)` / `.exclude(selector)` | scope the scan to part of the page / skip parts |
| `.disableRules([...])` | turn off specific rules (use sparingly, with a reason) |
| `.analyze()` | run the scan; returns `{ violations, passes, incomplete, inapplicable }` |
| `violation.id / impact / nodes / helpUrl` | rule id, `minor`→`critical`, failing elements, docs link |

`incomplete` holds checks axe **could not decide** (often colour contrast over images or gradients). These need a human to look.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `node: command not found` / `'node' is not recognized` | Install Node LTS, then **reopen** the terminal. |
| `npm install` fails with `ECONNREFUSED`, `ETIMEDOUT` or `407` | You're behind a proxy. Configure it with `npm config set proxy [our proxy URL]` and `npm config set https-proxy [our proxy URL]`, or point npm at [our internal npm registry]. |
| `npx playwright install` hangs or fails | Use your installed browser instead (below), or set `HTTPS_PROXY` and retry. |
| `Executable doesn't exist at ...ms-playwright...` | Step 3 was skipped or failed. Re-run it, or use your installed browser (below). |
| `Error: http://localhost:4173 is already used` | Stop `npm run serve` (`Ctrl+C`), or pick another port (below). |
| Test file changes are ignored | Make sure you saved the file and it's inside `tests/` and ends with `.spec.ts`. |
| PowerShell says scripts are disabled (`npx.ps1 cannot be loaded`) | Run `npx.cmd playwright test`, or use Command Prompt / Git Bash. |

**Use your installed Chrome or Edge instead of downloading Chromium:**

macOS / Linux / Git Bash:

```bash
PW_CHANNEL=chrome npx playwright test
```

Windows PowerShell:

```powershell
$env:PW_CHANNEL="chrome"; npx playwright test
```

(Use `msedge` for Edge.)

**Use a different port:** set `PORT=5000` the same way you set `PW_CHANNEL` above.

---

## Appendix: build this from an empty folder

If you want to recreate the setup in your own project:

```bash
mkdir my-a11y-tests
```

```bash
cd my-a11y-tests
```

```bash
npm init -y
```

```bash
npm install -D @playwright/test @axe-core/playwright
```

```bash
npx playwright install chromium
```

Then add a `playwright.config.ts` with `testDir`, `use.baseURL` and (optionally) `webServer` pointing at your app, and copy `tests/01-first-scan.spec.ts` as a starting point. `npm init playwright@latest` also works if you prefer an interactive scaffold.

## Further reading

- Playwright accessibility testing guide: <https://playwright.dev/docs/accessibility-testing>
- axe-core rule list: <https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md>
- WCAG 2.2 quick reference: <https://www.w3.org/WAI/WCAG22/quickref/>
- [our internal accessibility guidelines / Confluence page]
