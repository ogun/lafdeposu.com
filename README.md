# Laf Deposu

Turkish word-finder single page application. Search a local SQLite dictionary by characters, prefixes, suffixes, and content filters. All processing happens client-side in the browser — zero backend, zero frameworks.

## Features

- Search words by exact characters, starts-with, contains, ends-with
- Wildcard support (`*`) for joker letters
- Toggle between list view and column view
- Filter panel with multiple comma-separated criteria
- URL-driven search state (shareable search links)
- Turkish character input buttons (ç, ğ, ı, ö, ş, ü)
- Fully client-side – no backend required

## Tech Stack

- **Vanilla JavaScript (ES Modules)** – all application logic, no frameworks
- **Vanilla CSS** – custom styling with CSS Custom Properties
- **sql.js (SQLite WASM)** – in-browser database queries
- **Node.js** – local dev server and test runner

> Previously built on AngularJS, Bootstrap, and jQuery — all have been removed in favor of native browser APIs for better performance and zero dependencies.

## Project Structure

```
├── index.html          # Single-file SPA (HTML + CSS + JS)
├── data/               # SQLite dictionary (dict.db)
├── dist/               # sql.js WASM runtime
│   ├── sql-wasm.js
│   └── sql-wasm.wasm
├── server.js           # Static file server for local dev
├── tests/              # Test suite
│   └── search.test.js  # Puppeteer-based UI tests
├── favicon.ico
└── package.json
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- Google Chrome (for headless tests)

### Install Dependencies

```bash
npm install
```

### Run Local Server

```bash
node server.js
```

Open `http://localhost:8080` in your browser.

### Run Tests

Start the server first, then:

```bash
npm test
```

Runs 10 automated UI tests via Puppeteer covering search, filters, view modes, and URL state.

### Stop Server

```bash
fuser -k 8080/tcp
```

## License

See LICENSE file.
