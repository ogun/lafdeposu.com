# AGENTS.md

## Overview

`Laf Deposu` is a client‑side Turkish word‑finder SPA built with AngularJS 1.x, Bootstrap 3, jQuery 2.1, and **sql.js** (SQLite compiled to WebAssembly). All processing occurs in the browser; the static site is served via a simple HTTP server.

## Architecture snapshot (extracted from docs)

- **UI layer** – `index.html` loads AngularJS, Bootstrap, jQuery and the app module (`js/angular.js`).
- **Core logic** – `js/app.js` initializes `sql.js`, loads `data/dict.db`, builds SQL queries (`createCommandText`) and filters results (`controlDbWord`, `controlFilter`).
- **Data layer** – `data/dict.db` (SQLite) holds the `dictionary` table (`word`, `meaning`). The DB is fetched once on page load and kept in memory.
- **Views** – two display modes: list view and column view, toggled by `changeListType(1)`/`changeListType(0)`. Preferences stored in cookies.

## Agents used in development

| Agent | Role |
|-------|------|
| **code‑jerk** | Detect dead/over‑engineered code, duplicate logic, unused imports. |
| **fast‑api‑developer** | Not directly applicable (no FastAPI), but used for bulk code clean‑up. |
| **puppeteer** (via Node) | Automated UI testing – drives the web page, fills the search box, clicks buttons, verifies results. |

## How to test – ensure nothing is broken

1. **Install dependencies** (run once):
   ```bash
   npm install   # installs puppeteer (already in package.json)
   # npm install -g playwright   # not needed after we switched to puppeteer
   ```
2. **Serve the site** (any static‑file server works, e.g. Python’s built‑in server):
   ```bash
   python3 -m http.server 8080 &   # runs in background
   ```
   The server PID is printed; you can stop it later with `kill <PID>`.
3. **Run the automated test script** (`test_search.js` lives in the repo root):
   ```bash
   node test_search.js
   ```
   Expected output:
   ```
   List view RESULT: PASS
   Column view RESULT: PASS
   ```
   The script:
   - Launches Chrome head‑less (`/usr/bin/google-chrome`).
   - Types `kar` into `#srch-term`.
   - Clicks `#srch-button`.
   - Waits for result tables, extracts all words, and checks that both `ark` and `kar` appear.
   - Repeats the check after switching to column view via the button `ng-click="changeListType(1)"`.
4. **Manual verification (optional)**
   - Open `http://localhost:8080` in a browser.
   - Enter `kar` in the search field and press *Enter* or click the search button.
   - Verify that the results list contains both **ark** and **kar** in list view.
   - Click the *column view* button (the one with `ng-click="changeListType(1)"`) and verify the same words appear.
5. **Cleanup**
   - Stop the HTTP server: `kill <PID>` (replace `<PID>` with the number printed when you started the server).
   - Remove any temporary files if needed.

## Common pitfalls

- **Missing libraries** – keep `dist/jquery-2.1.1.min.js`, `dist/bootstrap.min.js`, and all Angular scripts referenced in `index.html`. The `code‑jerk` audit removed unused imports, but these three are required for UI interactions.
- **Browser executable** – Puppeteer expects Chrome at `/usr/bin/google-chrome`. Adjust `executablePath` in `test_search.js` if Chrome is installed elsewhere.
- **Cache** – after code changes, do a hard refresh (Ctrl+F5) to avoid stale JS or DB files.

---

*Generated in caveman mode (full) – concise, token‑efficient.*