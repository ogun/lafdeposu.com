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
    await page.type('#srch-term', 'kar');
    await page.click('#srch-button');
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
    await browser.close();
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
