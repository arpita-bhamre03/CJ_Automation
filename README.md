# CentraJob Test Automation

Layered UI and API automation for CentraJob, built on **TypeScript + Playwright Test**.

---

## 1. Application under test

CentraJob is a multi-portal recruitment platform. The automation framework treats it
as a black box and **never modifies application code**.

| Layer | Technology |
|---|---|
| Frontend | React (Vite, **TypeScript** — see note below) |
| Backend | REST API, multiple services (account, admin, employer, college, candidate, notification) |
| Database | Azure Cosmos DB |
| Active environment | **DEV** |

### Portals

CentraJob DEV is four separate React applications on four origins:

| Portal | DEV URL |
|---|---|
| Candidate | `https://dev-candidate.centrajob.com` |
| Employer | `https://dev-employer.centrajob.com` |
| College | `https://dev-college.centrajob.com` |
| Admin | `https://dev-adminpanel.centrajob.com/job-fair` |

Portal URLs live in [config/config.ts](config/config.ts) and are resolved through
[core/platform/platform.ts](core/platform/platform.ts). Never hard-code a URL anywhere else.

> **Stack note.** The employer frontend at `centrajob_employer_frontend` is a
> **TypeScript** React app (`tsconfig.app.json`, `App.tsx`, Vite), not plain JavaScript.
> Its API endpoint catalogue (`src/api/endpoints.ts`) uses PascalCase controller routes
> such as `/api/Account/LogIn` across several service base URLs — a multi-service
> backend, not a single Express app. Confirm the real backend stack before writing API tests.

---

## 2. Automation stack

```
Playwright Test (TypeScript)
  └── tests/            assertions, markers, fixtures
        └── pages/      Page Object Model  →  BasePage  →  Playwright
        └── api/        Service → Abstract Service → Client → REST API
        └── database/   DB helper → Cosmos DB   (pending)
```

Do not confuse the two stacks: the application is React + REST + Cosmos; the framework
is TypeScript + Playwright. They are separate concerns.

---

## 3. Setup

**Prerequisites:** Node.js 18+ and npm.

```bash
npm install
npx playwright install chromium
cp .env.example .env      # then fill in real values
```

### Environment variables

All secrets come from `.env`, which is gitignored and must never be committed.

| Variable | Purpose |
|---|---|
| `ENV` | Active environment (`dev` default) |
| `<PORTAL>_USERNAME` / `<PORTAL>_PASSWORD` | Credentials per portal persona |
| `HEADLESS` | `false` to watch the browser — it opens maximized and runs one test at a time |
| `SLOW_MO` | ms paused before each action, so you can see what is being targeted |
| `TYPE_DELAY` | ms between keystrokes; above 0, text is typed rather than set at once |
| `ADMIN_MFA` | `force` (default) or `auto` — see "Admin sign-in: emailed verification code" |
| `REPORTS_DIR`, `TRACE_MODE`, `VIDEO_MODE` | Artifact behaviour |
| `LOG_LEVEL` | `DEBUG` / `INFO` / `WARN` / `ERROR` |
| `*_API_URL` | API service base URLs (pending) |
| `COSMOS_*` | Cosmos DB connection (pending) |

There are **no credential defaults**. A missing variable throws a clear error rather
than running the test with a placeholder and producing a misleading auth failure.

> **Always quote values in `.env`.** dotenv treats an unquoted `#` as the start of a
> comment, so `PASSWORD=Secret#1` is silently read as `Secret` — which surfaces much
> later as an "Invalid Password" error on the login form, with a submit button that
> never enables. Write `PASSWORD="Secret#1"`.

---

## 4. Running tests

```bash
npm test                                     # everything
npm run test:smoke                           # @smoke only
npm run test:regression                      # @regression only
npm run test:headed                          # watch the browser (already the default via .env)
npm run test:debug                           # step through each action
npx playwright test tests/web/employer/login.spec.ts # one file
npx playwright test --grep @login            # one tag
ENV=dev npx playwright test                  # choose environment
npx playwright test --project=chromium       # choose browser
npm run report                               # open the HTML report
```

Static checks:

```bash
npm run typecheck
npm run lint
npm run format
```

---

## 5. Project structure

```
config/       environment config, resolved settings, project constants
core/         BasePage, driver factory, portal resolution, login factory
pages/        Page Object Model, grouped by portal
helpers/      shared logger, failure artifacts, domain flows
utilities/    generic, project-independent helpers (never imports pages/)
api/          interface → client → abstract → service → response assertions
database/     Cosmos DB validation (pending)
testdata/     personas, expected UI strings, payloads
tests/        fixtures + specs, UI specs grouped per portal
ci/           Jenkinsfile
docs/         project documentation
reports/      generated artifacts (gitignored)
```

Page objects and UI specs are both grouped by portal, so a portal's pages and its
specs sit at the same path under each root — `pages/employer/login-page.ts` pairs
with `tests/web/employer/login.spec.ts`:

```
pages/                              tests/
├── candidate/  login-page.ts       ├── fixtures/   shared test fixtures
├── employer/   login-page.ts       ├── web/
│               signup-page.ts      │   ├── candidate/  login.spec.ts
├── college/    login-page.ts       │   ├── employer/   login.spec.ts, signup.spec.ts
├── admin/      login-page.ts       │   ├── college/    login.spec.ts
└── common/     yopmail-inbox-page  │   └── admin/      login.spec.ts
                                    └── services/web/   API specs (none yet)
```

A new page object goes in `pages/<portal>/<feature>-page.ts` and its spec in
`tests/web/<portal>/<feature>.spec.ts`. The folder already names the portal, so do
not repeat it in the filename. `pages/common/` is for page objects shared across
portals — put one there only when it is genuinely used by more than one.

### Layering rules

| Layer | Contains | Must not contain |
|---|---|---|
| `tests/` | fixtures, page-method calls, assertions, tags | locators, waits, `new SomePage()` |
| `pages/` | locators, actions, queries, waits | assertions, test data |
| `core/base` | generic Playwright wrappers | CentraJob-specific logic |
| `helpers/` | multi-step domain flows, setup | locators, assertions |
| `utilities/` | generic utilities | imports from `pages/` |
| `api/` | request building, clients, services | UI code |
| `config/` | URLs, timings, env resolution | test data, locators |
| `testdata/` | data, expected strings, payloads | execution logic |

Page objects never assert. Tests assert on values page objects return. Tests never
construct page objects — every page object is exposed as a fixture in
[tests/fixtures/test-fixtures.ts](tests/fixtures/test-fixtures.ts).

---

## 6. Selector strategy — read before writing a page object

**The deployed DEV app exposes `data-testid` hooks — use them.** The employer auth
screen carries 47, all prefixed `auth-`: `auth-login-email-input`,
`auth-login-password-input`, `auth-login-submit-button`, `auth-login-form`, and so on.

> **The local frontend checkout is stale.** `centrajob_employer_frontend/src` contains
> **zero** `data-testid` occurrences, yet the running DEV build renders 47 of them.
> When adding selectors, trust the running app over that source tree — dump the live
> hooks with
> `document.querySelectorAll('[data-testid],[data-qa-id]')` rather than grepping source.

Selector order of preference:

1. `[data-qa-id="..."]` — none exist yet; kept first so locators tighten automatically
   if the attribute is ever added
2. `[data-testid="..."]` — **the practical default**, via `page.getByTestId(...)`
3. Accessible roles and names — `getByRole('heading', { name: /^Welcome back,/i })`
4. Stable rendered attributes — `placeholder`, `name`, `type="submit"`
5. Never: generated class names, deep CSS, absolute XPath, DOM position

Coverage varies sharply by portal, so check the live DOM before assuming:

| Portal | Test hooks on the login screen | Naming |
|---|---|---|
| College | 163 | unprefixed — `login-form`, `login-email-input`, `login-submit-btn` |
| Employer | 47 | `auth-` prefixed — `auth-login-email-input` |
| Admin | 0 `data-testid`; 5 element ids | `Login_` prefixed ids — `#Login_email_input`, `#Login_submit` |
| Candidate | not yet surveyed | — |

Dashboards are far thinner than login screens. The employer dashboard exposes three
hooks and the college dashboard none, so both anchor verification on the
"Welcome back," heading instead — plus the app shell's `<header>` on employer,
which the college portal does not render. The admin dashboard is the exception:
it carries `#Dashboard_*` and `#Sidebar_menu_*` ids, plus an exact "Dashboard" title.

**Pop-ups hide the page from role-based lookups.** The employer dashboard can open a
pop-up such as "A Virtual Job Fair is live". While it is open, MUI marks everything
behind it `aria-hidden`, and `getByRole()` skips `aria-hidden` elements — so a
greeting that is plainly on screen is "not found". Whether the pop-up is already open
depends on timing (a slowed, watched run reaches it; a fast headless run may not).
The employer dashboard anchors therefore match by tag and visible text instead.

The admin email field is `readonly` until focused (an anti-autofill technique), and
Playwright will not type into a readonly field — so the admin page object clicks each
field before filling it.

### Admin sign-in: emailed verification code (MFA)

After Sign in, the admin panel can route to `/verify-code` — "Verify it's you", six
single-digit boxes — and email a code to the admin's Yopmail address. Whether it does
is decided by the Firebase Remote Config flag **`enableMFA`**, which the browser
fetches right after the login call. DEV currently serves `enableMFA = "false"`
(template version 262), so an ordinary browser goes straight to `/dashboard`.

`ADMIN_MFA` controls what the tests do:

| Value | Behaviour |
|---|---|
| `force` (default) | the test browser receives `enableMFA = "true"`, so the code flow always runs — real `SendOTP`, real email, real `VerifyOTP`. Only this browser's view of the flag changes; Firebase, the app and the backend are untouched. |
| `auto` | follow Firebase; when no code is requested, steps 5–8 are skipped and the test is annotated saying so |

The code is read by [pages/common/yopmail-inbox-page.ts](pages/common/yopmail-inbox-page.ts).
The inbox keeps old codes and message timestamps are unreliable (seen ~20 minutes
ahead of local time), so the test notes the newest message id *before* signing in —
quietly, in a background tab — and only trusts a message that arrives after it. Once
the code screen appears it uses Yopmail the way a person would: types the address on
the home page, checks the inbox, opens the new email and highlights the code, then
switches back and types it into the panel. Codes expire after 2 minutes. Entering
the sixth digit submits automatically, so "Verify and sign in" is clicked only if that
did not happen. CI needs outbound access to yopmail.com.

**End an `.or()` fallback chain with `.first()`.** Once a page finishes rendering,
several alternatives in the chain can match at the same time, and `waitFor()` then
fails strict mode. Without `.first()` the result depends on render timing, so the
test passes or fails at random.

Do not add attributes to application code without approval.

### Form-validation-gated buttons

The employer submit button is `disabled` until formik considers the form valid, so
`clickLogin()` calls `waitForEnabled()` first. That turns "the form is invalid" into a
message that says so, instead of a generic click timeout.

---

## 7. Test data strategy

| Data | Format | Location |
|---|---|---|
| Personas (no secrets) | JSON | `testdata/users.json` |
| Credentials | env vars | `.env` |
| Expected UI strings | JSON | `testdata/<feature>/locales/en.json` |
| API payloads | JSON / TS | `testdata/<feature>/` |
| Unique values | generated | `utilities/data-generator.ts` |

Never hard-code test data in a test. Generate unique names, emails, companies, job
titles and phone numbers with `utilities/data-generator.ts` so parallel runs never collide.

---

## 8. Naming conventions

- Files and folders: `kebab-case` (`login-page.ts`, `job-fair/`)
- Classes: `PascalCase` (`CandidateLoginPage`)
- Methods: `camelCase`, named by intent
  - queries → `getErrorMessage()`
  - booleans → `isDashboardDisplayed()`
  - navigation → `navigateToLoginPage()`
- Locators named by intent (`loginButton`), never by implementation (`button1`)
- Tests tagged with a suite tag **and** a feature tag: `@smoke @login`

Suite tags: `@smoke`, `@regression`. Feature tags: `@login`, `@candidate`, `@employer`.

---

## 9. Adding to the framework

**A new page object**

1. Create `pages/<portal>/<feature>-page.ts` extending `BasePage`.
2. Locators at the top under a `// ===== LOCATORS =====` banner; then navigation,
   actions, queries. No assertions.
3. Add a fixture in `tests/fixtures/test-fixtures.ts`.
4. Use it in a spec via the fixture — never `new`.

**A new API service**

1. Add the domain under `api/service/<domain>/<name>-service.ts`, extending `AbstractService`.
2. Build requests with `RequestBuilder`; get tokens from `TokenProvider`.
3. Put reusable expectations in `api/response/<domain>/response-assertions.ts`.
4. Add specs under `tests/services/web/<domain>/`.

**Cosmos DB validation** — see [database/README.md](database/README.md). Blocked on
connection details and on approval for the `@azure/cosmos` dependency.

---

## 10. Reports and artifacts

Everything generated lands under `reports/`, which is gitignored:

```
reports/logs/          automation.log
reports/screenshots/   full-page failure screenshots
reports/downloads/     files downloaded during tests
reports/html/          Playwright HTML report
reports/junit/         JUnit XML for CI
```

On failure the framework automatically captures the URL, page title, a full-page
screenshot and the browser console log, and attaches them to the report.

Never commit screenshots, logs, downloads, traces or test results.

---

## 11. Logging

One shared logger:

```ts
import { logger } from '@helpers/logger';
logger.info('...');
```

`console` is forbidden in `pages/`, `helpers/`, `utilities/` and `api/` — enforced by
the `no-console` ESLint rule, with `helpers/logger.ts` as the only exception.

---

## 12. Dependencies

No new dependencies were added during the migration. The framework runs on the same
set the previous project used: `@playwright/test`, `typescript`, `dotenv`, `eslint`,
`prettier` and their types.

Anything further needs approval before installation, and must be added to
`package.json` with a comment explaining why. Known future asks:

| Package | Needed for |
|---|---|
| `@azure/cosmos` | Cosmos DB validation |
| `xlsx` or `exceljs` | `.xlsx` data-driven suites |
| `allure-playwright` | Richer reporting, if wanted |

---

## 13. Current coverage and known gaps

**Implemented**

- Candidate portal login (`@smoke @regression @login @candidate`)
- Employer portal login + dashboard verification, 7 reported steps
  (`@smoke @regression @login @employer`)
- College portal login + dashboard verification, 7 reported steps
  (`@smoke @regression @login @college`)
- Admin panel login with the emailed verification code read from Yopmail, then
  dashboard verification, 10 reported steps (`@smoke @regression @login @admin`)
- Employer sign-up through all three stages — 20 reported steps, each labelled
  with its stage (`@regression @signup @employer`):
  - **1/3** registration form, code emailed to a new Yopmail inbox, set password
  - **2/3** company details: designation, LinkedIn, website, industry, pincode with
    address auto-fill, address, description, company logo and profile photo
  - **3/3** registration, tax and address-proof documents, then Finish Sign-up,
    which submits the company for verification and opens the new employer's
    dashboard, greeting them by name with "Company Details will be verified
    within 24 hours"

  **Each run registers a new company on DEV** with generated, unique details. The
  upload files are small QA samples in `testdata/signup/assets/`.

> **The candidate test's assertion is weak and should be strengthened.** It asserts
> `expect(page).toHaveURL(/.*(candidate|dashboard|home).*/i)`, which the candidate
> portal's own login URL already satisfies — so the test passes whether or not login
> succeeds. It was carried over unchanged during the migration to preserve intent;
> it needs a real post-login signal, the way the employer test uses the dashboard.

**Scaffolded, not yet exercised**

- API layer: client, builder, abstract service, auth service, token provider,
  response assertions. Base URLs unset.

**Blocked**

| Gap | Blocks |
|---|---|
| API base URLs, auth mechanism, payload shapes | API tests |
| Cosmos endpoint/database/containers, `@azure/cosmos` approval | DB validation |
| No `data-qa-id` / `data-testid` in the React apps | Selector robustness |
| Mobile automation (deferred by decision) | Candidate app tests |
| Exact error-message text on DEV | `testdata/login/locales/en.json` TODOs |

**Deferred:** the previous `candidate-apk/` module was not migrated. It was named for
Android but drove desktop Chromium against the candidate web URL, with unused
`appPackage`/`appActivity` config and no Appium. Real mobile automation is planned and
will be designed properly when it starts. The original files remain in `CJ_Automation/`.
