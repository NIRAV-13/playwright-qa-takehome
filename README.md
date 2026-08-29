# Product Inventory — Playwright Automation

Automation for the QA take-home assessment against the Product Inventory application at
<https://qa-takehome-app.onrender.com/index.html>.

The suite covers the login journey and the product search feature (Option A), written as a small
Page Object Model project with HTML reporting and failure evidence.

| Deliverable | Location |
| --- | --- |
| Playwright project | this repository |
| Bug report | [`BUG_REPORT.md`](./BUG_REPORT.md) |
| Exploratory session notes | [`docs/exploratory-testing-notes.md`](./docs/exploratory-testing-notes.md) |

---

## Setup

Requires **Node.js 18 or newer**.

```bash
npm ci                          # or: npm install
npx playwright install chromium # downloads the browser binary
```

Credentials and the target URL default to the values supplied with the assignment. To point the
suite somewhere else, copy `.env.example` and export the variables, or set them inline:

```bash
BASE_URL=https://qa-takehome-app.onrender.com APP_EMAIL=... APP_PASSWORD=... npm test
```

## Running the tests

```bash
npm test              # full suite, headless
npm run test:headed   # watch it run in a browser
npm run test:ui       # Playwright UI mode — best for debugging
npm run test:smoke    # only tests tagged @smoke
npm run report        # open the HTML report from the last run
npm run typecheck     # strict TypeScript check, no tests executed
```

The suite is five tests and takes well under a minute once the application is warm.

## Reporting

Three reporters run together:

- **`list`** — readable console output while the run is in progress.
- **`html`** — the report a reviewer opens (`npm run report`). Written to `playwright-report/`.
- **`junit`** — machine-readable output at `test-results/junit.xml` for CI dashboards.

Evidence is captured **only on failure**, so a green run stays fast and the report stays small:

| Artefact | When |
| --- | --- |
| Screenshot | on failure |
| Video | retained on failure |
| Trace (DOM snapshots, network, console) | retained on failure |

A failing test therefore arrives with a screenshot at the moment of failure and a trace that can be
replayed step by step with `npx playwright show-trace <trace.zip>`.

CI is configured in [`.github/workflows/playwright.yml`](./.github/workflows/playwright.yml) and
uploads the HTML report as a build artefact.

## Project structure

```
├── playwright.config.ts   # timeouts, reporters, failure evidence, projects
├── global-setup.ts        # wakes the free-tier host before the suite starts
├── pages/                 # Page Objects — locators and actions, no assertions
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   └── DashboardPage.ts
├── fixtures/pages.ts      # injects page objects; provides a pre-authenticated dashboard
├── data/users.ts          # credentials, overridable per environment
├── tests/
│   ├── login.spec.ts      # login navigation (happy path + access denial)
│   └── search.spec.ts     # product search (match, no match, reset)
├── tools/dump-dom.mjs     # developer helper for inspecting the live DOM
└── docs/                  # exploratory testing notes
```

**Why it is split this way**

- **Page objects hold locators and actions; specs hold assertions.** A markup change is a one-line
  fix in one file, and a test reads as a description of user behaviour rather than a list of CSS
  selectors.
- **Fixtures instead of `beforeEach` blocks.** `authenticatedDashboard` performs the login once per
  test and hands back a ready dashboard, so the search tests contain only search logic. Setup
  failures are also reported separately from test failures, which makes a red run easier to triage.
- **Test data is not hard-coded.** The search test reads the first product from the rendered
  inventory and searches for a token from it, so the test survives a change to the seed data.

## Selector strategy

The application exposes no `data-testid` attributes, so locators are built from what the user can
see — label, placeholder, accessible role — and fall back to the element id. Where more than one of
those is plausible they are combined with `.or()`, for example:

```ts
this.searchInput = page
  .getByPlaceholder(/search/i)
  .or(page.getByLabel(/search/i))
  .or(page.locator('#search, #searchInput, input[type="search"]'))
  .first();
```

This keeps a single, readable locator that survives markup differences without resorting to
positional CSS or XPath chains, which are the usual source of flakiness in this kind of suite.

Synchronisation relies on Playwright's auto-waiting and web-first assertions. Where the list is
filtered client-side as the user types, the tests use `expect.poll` to wait for the rendered list to
settle. **There are no fixed sleeps anywhere in the suite.**

## Assumptions and trade-offs

| Decision | Reasoning |
| --- | --- |
| **Chromium only** | The application is a small CRUD UI with no browser-specific behaviour. Cross-browser projects would triple the runtime for very little added signal; adding Firefox and WebKit is a two-line config change if that risk profile changes. |
| **Login through the UI on every test, not a shared `storageState`** | For a five-test suite the saved seconds are not worth the coupling to how the app persists its session. `storageState` with a `setup` project is the right move once the suite grows past ~20 tests. |
| **Search chosen for the feature test (Option A)** | It is read-only, so it leaves no residue in the shared demo database. Add Product would need cleanup to stay re-runnable, which is out of scope at this size. |
| **The invalid-login test asserts access is refused, not the error copy** | Wording changes frequently and is not the risk worth guarding. The quality of the error feedback is covered by exploratory testing instead. |
| **Generous timeouts plus a global warm-up** | The app is hosted on a free Render instance that sleeps when idle; the first request after a cold start can take close to a minute. `global-setup.ts` absorbs that once rather than letting it surface as a flaky first test. |
| **Defects are documented, not automated** | The brief asks for quality over coverage. Regression tests for the known defects would fail by design and would be written after the fixes land. |
| **`tools/dump-dom.mjs` kept in the repo** | It is the helper used to inspect the real markup while writing locators. It is not part of the suite and is not run by `npm test`. |

## Known limitations

- No API-level or accessibility checks — the brief scopes this to UI flows.
- The category filter, add, edit and delete flows are exercised manually (see the exploratory notes)
  but not automated, per the "one feature" instruction.
- The suite runs against a shared public environment, so it assumes the seeded product data is
  present and that no other session is mutating it concurrently.
