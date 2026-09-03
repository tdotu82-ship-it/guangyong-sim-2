const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const root = 'C:/Users/10498/Desktop/website/simulation';

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

function getLocalIPv6() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv6' && !iface.internal && !iface.address.startsWith('fe80')) {
        return iface.address;
      }
    }
  }
  return null;
}

const server = http.createServer((req, res) => {
  // CORS headers for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let urlPath = req.url.split('?')[0];
  let filePath = path.join(root, urlPath === '/' ? 'index.html' : urlPath);
  const ext = path.extname(filePath);
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };
  res.setHeader('Content-Type', mimeTypes[ext] || 'text/plain');
  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200);
    res.end(content);
  } catch (e) {
    res.writeHead(404);
    res.end('Not found');
  }
});

const localIP = getLocalIP();
const localIPv6 = getLocalIPv6();
const host = '::'; // listen on all interfaces (IPv4 + IPv6)

server.listen(8083, host, () => {
  console.log('READY:');
  console.log(`  Local (IPv4):   http://127.0.0.1:8083/`);
  console.log(`  Network (IPv4): http://${localIP}:8083/`);
  if (localIPv6) {
    console.log(`  Network (IPv6): http://[${localIPv6}]:8083/`);
  }
  console.log('');
  console.log('Share these URLs with others on the same network:');
  console.log(`  IPv4: http://${localIP}:8083/`);
  if (localIPv6) {
    console.log(`  IPv6: http://[${localIPv6}]:8083/`);
  }
});
