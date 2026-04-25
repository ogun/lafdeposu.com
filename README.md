# Laf Deposu

Turkish word-finder SPA. Search a local SQLite dictionary by characters, prefixes, suffixes, and content filters. All processing happens client-side in the browser.

## Features

- Search words by exact characters, starts-with, contains, ends-with
- Toggle between list view and column view
- Filter panel with multiple criteria
- URL-driven search state (shareable search links)
- Fully client-side – no backend required

## Tech Stack

- **AngularJS 1.x** – UI framework
- **Bootstrap 3** – styling
- **jQuery 2.1** – DOM helpers
- **sql.js (SQLite WASM)** – in-browser database queries
- **Node.js** – local dev server and test runner

## Project Structure

```
├── index.html          # Entry point
├── js/                 # AngularJS app and controllers
├── css/                # Stylesheets
├── data/               # SQLite dictionary (dict.db)
├── dist/               # Vendor libs (jQuery, Bootstrap, Angular)
├── server.js           # Static file server for local dev
├── tests/              # Test suite
│   └── search.test.js  # Puppeteer-based UI tests
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
