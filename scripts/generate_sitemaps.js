const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://lafdeposu.com';
const DB_PATH = path.join(__dirname, '../data/dict.db');
const SITEMAPS_DIR = path.join(__dirname, '../sitemaps');

// Ensure sitemaps directory exists
if (!fs.existsSync(SITEMAPS_DIR)) {
  fs.mkdirSync(SITEMAPS_DIR, { recursive: true });
}

console.log('Connecting to database...');
const db = new Database(DB_PATH, { fileMustExist: true });

console.log('Fetching words from dictionary...');
const words = db.prepare('SELECT word FROM dictionary').all();

console.log(`Found ${words.length} words. Grouping by first letter...`);
const groupedWords = {};

for (const row of words) {
  const word = row.word.trim();
  if (!word) continue;
  
  // Use manual mapping for Turkish uppercase I and I-dot if they happen to exist
  let firstChar = word.charAt(0).toLowerCase();
  if (word.charAt(0) === 'I') firstChar = 'ı';
  if (word.charAt(0) === 'İ') firstChar = 'i';
  
  if (!groupedWords[firstChar]) {
    groupedWords[firstChar] = [];
  }
  groupedWords[firstChar].push(word);
}

// Write sub-sitemaps
console.log('Generating sub-sitemaps...');
const sitemapFiles = [];

for (const letter in groupedWords) {
  const wordList = groupedWords[letter];
  // Replace non-standard characters with 'other' if needed to make valid filename
  const safeLetter = letter.replace(/[^a-z0-9çğıöşü]/g, 'other');
  const filename = `sitemap-${safeLetter}.xml`;
  const filepath = path.join(SITEMAPS_DIR, filename);
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  
  for (const word of wordList) {
    const url = `${DOMAIN}/?keyword=${encodeURIComponent(word)}`;
    // Escape XML special characters
    const escapedUrl = url.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    xml += `  <url>\n    <loc>${escapedUrl}</loc>\n    <changefreq>monthly</changefreq>\n  </url>\n`;
  }
  
  xml += `</urlset>`;
  fs.writeFileSync(filepath, xml, 'utf8');
  sitemapFiles.push(filename);
}

// Write sitemap index
console.log('Generating sitemap index...');
let indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
indexXml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

for (const filename of sitemapFiles) {
  indexXml += `  <sitemap>\n    <loc>${DOMAIN}/sitemaps/${filename}</loc>\n  </sitemap>\n`;
}

indexXml += `</sitemapindex>`;
fs.writeFileSync(path.join(__dirname, '../sitemap.xml'), indexXml, 'utf8');

console.log(`Successfully generated ${sitemapFiles.length} sub-sitemaps and 1 sitemap index (sitemap.xml).`);
