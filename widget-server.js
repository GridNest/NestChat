const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/widget.js') {
    const widgetPath = path.join(__dirname, '../packages/widget/src/widget.js');
    
    fs.readFile(widgetPath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading widget.js:', err);
        res.writeHead(500);
        res.end('Error loading widget');
        return;
      }

      // Replace API URL with localhost for development
      const devWidget = data.replace(
        /https?:\/\/[^\/]+\/api/g,
        'http://localhost:5000/api'
      );

      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(devWidget);
    });
  } else if (req.url === '/') {
    // Serve test HTML page
    const htmlPath = path.join(__dirname, 'test-widget.html');
    fs.readFile(htmlPath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Test page not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Widget test server running at http://localhost:${PORT}`);
  console.log(`Test page: http://localhost:${PORT}/`);
  console.log(`Widget URL: http://localhost:${PORT}/widget.js`);
  console.log('\nPress Ctrl+C to stop');
});
