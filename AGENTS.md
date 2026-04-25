# AGENTS.md

## Overview

`Laf Deposu` is a client-side Turkish word-finder SPA built with AngularJS 1.x, Bootstrap 3, jQuery 2.1, and **sql.js** (SQLite compiled to WebAssembly). All processing occurs in the browser; the static site is served via a simple HTTP server. Always run test suite after the new implementation. All tests should pass, otherwise rollback your changes. Suggest a commit message after your change.

## Architecture snapshot (extracted from docs)

- **UI layer** – `index.html` loads AngularJS, Bootstrap, jQuery and the app module (`js/angular.js`).
- **Core logic** – `js/app.js` initializes `sql.js`, loads `data/dict.db`, builds SQL queries (`createCommandText`) and filters results (`controlDbWord`, `controlFilter`).
- **Data layer** – `data/dict.db` (SQLite) holds the `dictionary` table (`word`, `meaning`). The DB is fetched once on page load and kept in memory.
- **Views** – two display modes: list view and column view, toggled by `changeListType(1)`/`changeListType(0)`. Preferences stored in cookies.

## Agents used in development

| Agent | Role |
|-------|------|
| **code-jerk** | Detect dead/over-engineered code, duplicate logic, unused imports. |
| **fast-api-developer** | Not directly applicable (no FastAPI), but used for bulk code clean-up. |
| **qa-developer** | Wrote and maintains test suite in `tests/`. |
| **puppeteer** (via Node) | Automated UI testing – drives the web page, fills the search box, clicks buttons, verifies results. |

## How to test – ensure nothing is broken

1. **Install dependencies** (run once):
   ```bash
   npm install
   ```
   Installs puppeteer (for browser tests) and jest (test runner).

2. **Serve the site** with Node:
   ```bash
   node server.js &
   ```
   Static server runs at `http://localhost:8080`. Kill later with `fuser -k 8080/tcp` or `kill <PID>`.

3. **Run the test suite**:
   ```bash
   npm test
   ```
   Executes `tests/search.test.js` – 10 tests across two suites:
   - **UI Interaction Tests** – filter toggle, search URL updates, back button, list/column view results.
   - **URL Creation Tests** – query string construction with filters, empty search, back button revert.

   Expected output:
   ```
   Suite: UI Interaction Tests
     filter toggle should show and hide filters: PASS
     ...
   --- Summary ---
   Total tests: 10
   Passed: 10
   Failed: 0
   ```

4. **Manual verification (optional)**
   - Open `http://localhost:8080` in a browser.
   - Enter `kar` in the search field and press *Enter* or click the search button.
   - Verify that the results list contains both **ark** and **kar** in list view.
   - Click the *column view* button and verify the same words appear.

5. **Cleanup**
   - Stop the HTTP server: `fuser -k 8080/tcp`

## Common pitfalls

- **Missing libraries** – keep `dist/jquery-2.1.1.min.js`, `dist/bootstrap.min.js`, and all Angular scripts referenced in `index.html`.
- **Browser executable** – Puppeteer expects Chrome at `/usr/bin/google-chrome`. Adjust `executablePath` in `tests/search.test.js` if Chrome is installed elsewhere.
- **Server port** – tests expect `http://localhost:8080`. Ensure no other process occupies this port before starting `server.js`.
- **Cache** – after code changes, do a hard refresh (Ctrl+F5) to avoid stale JS or DB files.

---

*Generated in caveman mode (full) – concise, token-efficient.*
