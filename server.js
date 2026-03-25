const http = require('http');
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist', 'edugestion');
const port = Number(process.env.PORT || 10000);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
    });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const requestUrl = decodeURIComponent((req.url || '/').split('?')[0]);
  const cleanUrl = requestUrl === '/' ? '/index.html' : requestUrl;
  const requestedPath = path.join(distDir, cleanUrl);

  fs.stat(requestedPath, (err, stat) => {
    if (!err && stat.isFile()) {
      sendFile(res, requestedPath);
      return;
    }

    const assetPath = path.join(distDir, requestUrl);
    fs.stat(assetPath, (assetErr, assetStat) => {
      if (!assetErr && assetStat.isFile()) {
        sendFile(res, assetPath);
        return;
      }

      sendFile(res, path.join(distDir, 'index.html'));
    });
  });
});

server.listen(port, () => {
  console.log(`EduGestión server running on port ${port}`);
});