const puppeteer = require('puppeteer');

// ---------------------------------------------------------------------------
// Lightweight test framework (no external dependencies)
// ---------------------------------------------------------------------------
const suites = [];

function describe(suiteName, builder) {
  const suite = { name: suiteName, tests: [] };
  const it = (testName, testFn) => {
    suite.tests.push({ name: testName, run: testFn });
  };
  builder(it);
  suites.push(suite);
}

async function runAll() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle2' });
  await page.waitForSelector('#srch-term');

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const suite of suites) {
    console.log(`\nSuite: ${suite.name}`);
    for (const test of suite.tests) {
      totalTests++;
      process.stdout.write(`  ${test.name}: `);
      try {
        // Give the page a clean slate for each test
        await page.goto('http://localhost:8080', { waitUntil: 'networkidle2' });
        await page.waitForSelector('#srch-term');
        await test.run(page);
        console.log('PASS');
        passedTests++;
      } catch (err) {
        console.log('FAIL');
        console.error(`    Error: ${err.message}`);
        failedTests++;
      }
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Total tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);

  await browser.close();
  process.exit(failedTests > 0 ? 1 : 0);
}

// ---------------------------------------------------------------------------
// Test helpers (replace raw setTimeout with clearer waits)
// ---------------------------------------------------------------------------
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Suites and tests
// ---------------------------------------------------------------------------

describe('UI Interaction Tests', (it) => {
  it('filter toggle should show and hide filters', async (page) => {
    const filtersBefore = await page.$eval('#filters', (el) => el.classList.contains('hidden'));
    if (!filtersBefore) throw new Error('Filters should be hidden initially');

    await page.click('#filterAnchor');
    await wait(500);
    const filtersAfterFirst = await page.$eval('#filters', (el) => el.classList.contains('hidden'));
    if (filtersAfterFirst) throw new Error('Filters should be visible after first click');

    await page.click('#filterAnchor');
    await wait(500);
    const filtersAfterSecond = await page.$eval('#filters', (el) => el.classList.contains('hidden'));
    if (!filtersAfterSecond) throw new Error('Filters should be hidden after second click');
  });

  it('search should update URL with query string', async (page) => {
    await page.type('#srch-term', 'kar');
    await page.click('#srch-button');
    await wait(1000);
    const url = page.url();
    if (!url.includes('?kar')) throw new Error(`Expected URL to include '?kar', got ${url}`);
  });

  it('back button should remove query string from URL', async (page) => {
    await page.type('#srch-term', 'kar');
    await page.click('#srch-button');
    await wait(1000);
    await page.goBack();
    const url = page.url();
    if (url.includes('?kar')) throw new Error(`Expected URL not to include '?kar', got ${url}`);
  });

  it('list view should display matching words', async (page) => {
    await page.type('#srch-term', 'kar');
    await page.click('#srch-button');
    await wait(2000);
    await page.waitForSelector('table.table', { timeout: 5000 }).catch(() => {});
    const words = await page.$$eval('td div', (elems) => elems.map((e) => e.textContent.trim().toLowerCase()));
    if (!words.includes('kar') || !words.includes('ark')) {
      throw new Error(`Expected words to include 'kar' and 'ark', got ${JSON.stringify(words.slice(0, 5))}`);
    }
  });

  it('column view should display matching words', async (page) => {
    await page.type('#srch-term', 'kar');
    await page.click('#srch-button');
    await wait(2000);
    await page.waitForSelector('table.table', { timeout: 5000 }).catch(() => {});
    // Switch to column view
    await page.click('button[ng-click="changeListType(1)"]');
    await wait(2000);
    const words = await page.$$eval('td div', (elems) => elems.map((e) => e.textContent.trim().toLowerCase()));
    if (!words.includes('kar') || !words.includes('ark')) {
      throw new Error(`Expected words to include 'kar' and 'ark', got ${JSON.stringify(words.slice(0, 5))}`);
    }
  });
});

describe('URL Creation Tests', (it) => {
  it('should create URL with only chars (no filters)', async (page) => {
    await page.type('#srch-term', 'kar');
    await page.click('#srch-button');
    await wait(1000);
    const url = page.url();
    const query = url.split('?')[1];
    if (query !== 'kar') throw new Error(`Expected query 'kar', got '${query}'`);
  });

  it('should create URL with chars and startsWith filter', async (page) => {
    await page.click('#filterAnchor');
    await wait(500);
    await page.type('#srch-term', 'kemal');
    await page.type('input[ng-model="startsWith"]', 'a');
    await page.click('#srch-button');
    await wait(1000);
    const url = page.url();
    if (!url.includes('?kemal&startsWith=a')) {
      throw new Error(`Expected URL to include '?kemal&startsWith=a', got ${url}`);
    }
  });

  it('should create URL with all filters', async (page) => {
    await page.click('#filterAnchor');
    await wait(500);
    await page.type('#srch-term', 'kemal');
    await page.type('input[ng-model="startsWith"]', 'a');
    await page.type('input[ng-model="contains"]', 'k');
    await page.type('input[ng-model="endsWith"]', 'k');
    await page.click('input[ng-model="resultCharCount"]'); // toggle to 2?
    await page.click('#srch-button');
    await wait(1000);
    const url = page.url();
    const expectedParts = ['?kemal', 'startsWith=a', 'contains=k', 'endsWith=k', 'resultCharCount=2'];
    for (const part of expectedParts) {
      if (!url.includes(part)) {
        throw new Error(`Expected URL to include '${part}', got ${url}`);
      }
    }
  });

  it('should create URL with empty chars (no query)', async (page) => {
    await page.click('#srch-button');
    await wait(1000);
    const url = page.url();
    if (url.includes('?')) throw new Error(`Expected no query string, got ${url}`);
  });

  it('back button should revert URL after search', async (page) => {
    await page.type('#srch-term', 'kar');
    await page.click('#srch-button');
    await wait(1000);
    await page.goBack();
    const url = page.url();
    if (url.includes('?kar')) throw new Error(`Expected URL not to include '?kar', got ${url}`);
  });
});

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------
runAll().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
