const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8090;
const ROOT = __dirname;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png'
};

http.createServer((req, res) => {
  let pathname = decodeURIComponent(req.url.split('?')[0]);

  if (pathname === '/') pathname = '/index.html';

  const file = path.join(ROOT, pathname);

  if (!file.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    res.writeHead(200, {
      'Content-Type':
        types[path.extname(file)] ||
        'application/octet-stream',
      'Cache-Control': 'no-cache'
    });

    res.end(data);
  });
}).listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('Food Recorder is running.');
  console.log('Open: http://localhost:' + PORT);
  console.log('');
});
