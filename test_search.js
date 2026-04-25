const puppeteer = require('puppeteer');
(async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome',
      headless: true,
      args: ['--no-sandbox','--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('http://localhost:8080', {waitUntil: 'networkidle2'});
    await page.waitForSelector('#srch-term');

    // test filter toggle
    const filtersBefore = await page.$eval('#filters', el => el.classList.contains('hidden'));
    console.log('Filters hidden initially:', filtersBefore);
    await page.click('#filterAnchor');
    await new Promise(r=>setTimeout(r,500));
    let filtersAfter = await page.$eval('#filters', el => el.classList.contains('hidden'));
    console.log('Filters hidden after first click:', filtersAfter);
    // toggle again to hide
    await page.click('#filterAnchor');
    await new Promise(r=>setTimeout(r,500));
    const filtersAfter2 = await page.$eval('#filters', el => el.classList.contains('hidden'));
    console.log('Filters hidden after second click:', filtersAfter2);
    console.log('Filter toggle RESULT:', (filtersBefore === true && filtersAfter === false && filtersAfter2 === true) ? 'PASS' : 'FAIL');
    await page.type('#srch-term', 'kar');
    await page.click('#srch-button');
      // verify URL updated with query string
      const urlAfterSearch = page.url();
      console.log('URL after search:', urlAfterSearch);
      const urlPass = urlAfterSearch.includes('?kar');
      console.log('URL UPDATE RESULT:', urlPass ? 'PASS' : 'FAIL');
      // test back button (browser back)
      await page.goBack();
      const urlAfterBack = page.url();
      console.log('URL after back:', urlAfterBack);
      const backPass = !urlAfterBack.includes('?kar');
      console.log('Back button RESULT:', backPass ? 'PASS' : 'FAIL');
    // wait for results to populate; give 2 seconds
    await new Promise(r=>setTimeout(r,2000));
    // wait for result tables to appear
    await page.waitForSelector('table.table', {timeout: 5000}).catch(()=>{});
    // extract all word texts
    let words = await page.$$eval('td div', elems => elems.map(e=>e.textContent.trim().toLowerCase()));
    console.log('List view words sample:', words.slice(0,5));
    let hasKar = words.includes('kar');
    let hasArk = words.includes('ark');
    console.log('List view RESULT:', hasKar && hasArk ? 'PASS' : 'FAIL');

    // click column view button
    await page.click('button[ng-click="changeListType(1)"]');
    await new Promise(r=>setTimeout(r,2000));
    words = await page.$$eval('td div', elems => elems.map(e=>e.textContent.trim().toLowerCase()));
    console.log('Column view words sample:', words.slice(0,5));
    hasKar = words.includes('kar');
    hasArk = words.includes('ark');
    console.log('Column view RESULT:', hasKar && hasArk ? 'PASS' : 'FAIL');

    // URL creation tests
    let url;
    console.log('\n--- URL Creation Tests ---');

    // Test 1: Only chars, no filters
    console.log('Test 1: Only chars (no filters)');
    await page.goto('http://localhost:8080', {waitUntil: 'networkidle2'});
    await page.type('#srch-term', 'kar');
    await page.click('#srch-button');
    await new Promise(r=>setTimeout(r,1000));
    url = page.url();
    console.log('URL:', url);
    let test1Pass = url.split('?')[1] === 'kar';
    console.log('Test 1 RESULT:', test1Pass ? 'PASS' : 'FAIL');

    // Test 2: chars + startsWith
    console.log('\nTest 2: Chars + startsWith');
    await page.goto('http://localhost:8080', {waitUntil: 'networkidle2'});
    await page.type('#srch-term', 'kemal');
    await page.click('#filterAnchor');
    await new Promise(r=>setTimeout(r,500));
    await page.type('input[ng-model="startsWith"]', 'a');
    await page.click('#srch-button');
    await new Promise(r=>setTimeout(r,1000));
    url = page.url();
    console.log('URL:', url);
    let test2Pass = url.includes('?kemal&startsWith=a');
    console.log('Test 2 RESULT:', test2Pass ? 'PASS' : 'FAIL');

    // Test 3: All filters
    console.log('\nTest 3: All filters');
    await page.goto('http://localhost:8080', {waitUntil: 'networkidle2'});
    await page.type('#srch-term', 'kemal');
    await page.click('#filterAnchor');
    await new Promise(r=>setTimeout(r,500));
    await page.type('input[ng-model="startsWith"]', 'a');
    await page.type('input[ng-model="contains"]', 'k');
    await page.type('input[ng-model="endsWith"]', 'k');
    await page.click('input[ng-model="resultCharCount"]');
    await page.click('#srch-button');
    await new Promise(r=>setTimeout(r,1000));
    url = page.url();
    console.log('URL:', url);
    let test3Pass = url.includes('?kemal&startsWith=a&contains=k&endsWith=k&resultCharCount=2');
    console.log('Test 3 RESULT:', test3Pass ? 'PASS' : 'FAIL');

    // Test 4: Empty chars
    console.log('\nTest 4: Empty chars');
    await page.goto('http://localhost:8080', {waitUntil: 'networkidle2'});
    await page.click('#srch-button');
    await new Promise(r=>setTimeout(r,1000));
    url = page.url();
    console.log('URL:', url);
    let test4Pass = !url.includes('?');
    console.log('Test 4 RESULT:', test4Pass ? 'PASS' : 'FAIL');

    // Test 5: Back button
    console.log('\nTest 5: Back button');
    await page.goto('http://localhost:8080', {waitUntil: 'networkidle2'});
    await page.type('#srch-term', 'kar');
    await page.click('#srch-button');
    await new Promise(r=>setTimeout(r,1000));
    await page.goBack();
    url = page.url();
    console.log('URL after back:', url);
    let test5Pass = !url.includes('?kar');
    console.log('Test 5 RESULT:', test5Pass ? 'PASS' : 'FAIL');

    await browser.close();
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
