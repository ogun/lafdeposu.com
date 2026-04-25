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

describe('URL Querystring Tests', (it) => {
  it('loads page with only search term querystring', async (page) => {
    await page.goto('http://localhost:8080/?keyword=kar', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#srch-term');
    const term = await page.$eval('#srch-term', el => el.value);
    if (term !== 'kar') throw new Error(`Expected search term 'kar', got '${term}'`);
    // No filters should be visible
    const filtersHidden = await page.$eval('#filters', el => el.classList.contains('hidden'));
    if (!filtersHidden) throw new Error('Filters panel should be hidden when no filter params');
    // Results should show matching words
    await page.waitForSelector('table.table', { timeout: 5000 }).catch(() => {});
    const words = await page.$$eval('td div', elems => elems.map(e => e.textContent.trim().toLowerCase()));
    if (!words.includes('kar') && !words.includes('ark')) {
      throw new Error(`Expected results to include 'kar' or 'ark', got ${JSON.stringify(words.slice(0,5))}`);
    }
  });

  it('loads page with search term and startsWith filter', async (page) => {
    await page.goto('http://localhost:8080/?keyword=kemal&startsWith=a', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#srch-term');
    const term = await page.$eval('#srch-term', el => el.value);
    if (term !== 'kemal') throw new Error(`Expected search term 'kemal', got '${term}'`);
    const startsWith = await page.$eval('input[ng-model="startsWith"]', el => el.value);
    if (startsWith !== 'a') throw new Error(`Expected startsWith filter 'a', got '${startsWith}'`);
    // Filter panel should be visible
    const filtersHidden = await page.$eval('#filters', el => el.classList.contains('hidden'));
    if (filtersHidden) throw new Error('Filters panel should be visible when filter params present');
    // Results should include words starting with 'a' among kemal results
    await page.waitForSelector('table.table', { timeout: 5000 }).catch(() => {});
    const words = await page.$$eval('td div', elems => elems.map(e => e.textContent.trim().toLowerCase()));
    if (!words.some(w => w.startsWith('a'))) {
      throw new Error(`Expected at least one result starting with 'a', got ${JSON.stringify(words.slice(0,5))}`);
    }
  });

  it('loads page with multiple filters and checks results', async (page) => {
    await page.goto('http://localhost:8080/?keyword=kar&contains=a&endsWith=r', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#srch-term');
    const term = await page.$eval('#srch-term', el => el.value);
    if (term !== 'kar') throw new Error(`Expected search term 'kar', got '${term}'`);
    const contains = await page.$eval('input[ng-model="contains"]', el => el.value);
    if (contains !== 'a') throw new Error(`Expected contains filter 'a', got '${contains}'`);
    const endsWith = await page.$eval('input[ng-model="endsWith"]', el => el.value);
    if (endsWith !== 'r') throw new Error(`Expected endsWith filter 'r', got '${endsWith}'`);
    const filtersHidden = await page.$eval('#filters', el => el.classList.contains('hidden'));
    if (filtersHidden) throw new Error('Filters panel should be visible when filter params present');
    await page.waitForSelector('table.table', { timeout: 5000 }).catch(() => {});
    const words = await page.$$eval('td div', elems => elems.map(e => e.textContent.trim().toLowerCase()));
    if (!words.some(w => w.includes('a') && w.endsWith('r'))) {
      throw new Error(`Expected results containing 'a' and ending with 'r', got ${JSON.stringify(words.slice(0,5))}`);
    }
  });
});

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
    if (!url.includes('?keyword=kar')) throw new Error(`Expected URL to include '?keyword=kar', got ${url}`);
  });

  it('back button should remove query string from URL', async (page) => {
    await page.type('#srch-term', 'kar');
    await page.click('#srch-button');
    await wait(1000);
    await page.goBack();
    const url = page.url();
    if (url.includes('?keyword=kar')) throw new Error(`Expected URL not to include '?keyword=kar', got ${url}`);
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
    if (query !== 'keyword=kar') throw new Error(`Expected query 'keyword=kar', got '${query}'`);
  });

  it('should create URL with chars and startsWith filter', async (page) => {
    await page.click('#filterAnchor');
    await wait(500);
    await page.type('#srch-term', 'kemal');
    await page.type('input[ng-model="startsWith"]', 'a');
    await page.click('#srch-button');
    await wait(1000);
    const url = page.url();
    if (!url.includes('?keyword=kemal&startsWith=a')) {
      throw new Error(`Expected URL to include '?keyword=kemal&startsWith=a', got ${url}`);
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
    const expectedParts = ['?keyword=kemal', 'startsWith=a', 'contains=k', 'endsWith=k', 'resultCharCount=2'];
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
    if (url.includes('?keyword=kar')) throw new Error(`Expected URL not to include '?keyword=kar', got ${url}`);
  });
});

describe('Edit button toggle Tests', (it) => {
  it('help button href is only #', async (page) => {
    const href = await page.$eval('#help', el => el.getAttribute('href'));
    if (href !== '#') throw new Error(`Expected href '#', got '${href}'`);
  });
  it('help button toggles help section visibility', async (page) => {
    // Ensure help section initially hidden
    const helpHiddenInitially = await page.$eval('#help-section', el => el.classList.contains('hidden'));
    if (!helpHiddenInitially) throw new Error('Help section should be hidden initially');
    // Click help button
    await page.click('#help');
    await wait(200);
    const helpVisible = await page.$eval('#help-section', el => !el.classList.contains('hidden'));
    if (!helpVisible) throw new Error('Help section should be visible after click');
    // Click again to hide
    await page.click('#help');
    await wait(200);
    const helpHiddenAgain = await page.$eval('#help-section', el => el.classList.contains('hidden'));
    if (!helpHiddenAgain) throw new Error('Help section should be hidden after second click');
  });
  it('edit-button toggles visibility of trk-* buttons', async (page) => {
    // Wait for the edit button and trk-* buttons
    await page.waitForSelector('#edit-button');
    await page.waitForSelector('button[id^="trk-"]');

    // Verify that all trk-* buttons initially have the hidden class
    const buttonsHiddenInitially = await page.$$eval('button[id^="trk-"]', (buttons) =>
      buttons.every((btn) => btn.classList.contains('hidden'))
    );
    if (!buttonsHiddenInitially) throw new Error('All trk-* buttons should have hidden class initially');

    // Click edit-button to show trk-* buttons
    await page.click('#edit-button');
    await wait(200);

    // Verify that all trk-* buttons no longer have the hidden class
    const buttonsVisible = await page.$$eval('button[id^="trk-"]', (buttons) =>
      buttons.every((btn) => !btn.classList.contains('hidden'))
    );
    if (!buttonsVisible) throw new Error('All trk-* buttons should not have hidden class after first click');

    // Click edit-button again to hide trk-* buttons
    await page.click('#edit-button');
    await wait(200);

    // Verify that all trk-* buttons have the hidden class again
    const buttonsHiddenAgain = await page.$$eval('button[id^="trk-"]', (buttons) =>
      buttons.every((btn) => btn.classList.contains('hidden'))
    );
    if (!buttonsHiddenAgain) throw new Error('All trk-* buttons should have hidden class after second click');
  });
});

describe('Turkish Character Button Tests', (it) => {
  it('clicking trk-c button appends ç to empty srch-term', async (page) => {
    await page.click('#edit-button');
    await wait(200);
    await page.click('#trk-c-button');
    await wait(200);
    const term = await page.$eval('#srch-term', el => el.value);
    if (term !== 'ç') throw new Error(`Expected srch-term to be 'ç', got '${term}'`);
  });

  it('clicking multiple trk buttons appends in order', async (page) => {
    await page.click('#edit-button');
    await wait(200);
    await page.click('#trk-c-button');
    await page.click('#trk-g-button');
    await page.click('#trk-i-button');
    await wait(200);
    const term = await page.$eval('#srch-term', el => el.value);
    if (term !== 'çğı') throw new Error(`Expected srch-term to be 'çğı', got '${term}'`);
  });

  it('clicking non-trk button does not modify srch-term', async (page) => {
    await page.type('#srch-term', 'test');
    await page.click('#srch-button');
    await wait(200);
    const term = await page.$eval('#srch-term', el => el.value);
    if (term !== 'test') throw new Error(`Expected srch-term to remain 'test', got '${term}'`);
  });

  it('clicking trk button appends to existing srch-term value', async (page) => {
    await page.type('#srch-term', 'ka');
    await page.click('#edit-button');
    await wait(200);
    await page.click('#trk-c-button');
    await wait(200);
    const term = await page.$eval('#srch-term', el => el.value);
    if (term !== 'kaç') throw new Error(`Expected srch-term to be 'kaç', got '${term}'`);
  });

  it('trk buttons do nothing when hidden', async (page) => {
    try { await page.click('#trk-c-button'); } catch (e) {}
    await wait(200);
    const term = await page.$eval('#srch-term', el => el.value);
    if (term !== '') throw new Error(`Expected srch-term to be empty, got '${term}'`);
  });
});

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------
runAll().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
