const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname);
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'application/font-woff',
  '.woff2': 'application/font-woff2',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

const server = http.createServer((req, res) => {
  // Strip query string and hash from URL
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  let filePath = path.join(root, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath) || '.html';
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(8080, () => console.log('Server running at http://localhost:8080'));
