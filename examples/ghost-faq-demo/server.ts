/**
 * ghost-faq-demo/server — Local web server for GhostSupportBot.
 *
 * Usage:
 *   npx tsx examples/ghost-faq-demo/server.ts
 *   Then open http://localhost:3777
 */
import * as http from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GhostSupportBot } from '../../src/index.js';

const bot = new GhostSupportBot();
const PORT = 3777;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const htmlPath = path.join(__dirname, 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  if (req.method === 'GET' && req.url === '/logo.png') {
    const logoPath = path.join(__dirname, 'logo.png');
    const logo = fs.readFileSync(logoPath);
    res.writeHead(200, { 'Content-Type': 'image/png' });
    res.end(logo);
    return;
  }

  if (req.method === 'POST' && req.url === '/ask') {
    let body = '';
    req.on('data', (chunk: Buffer) => (body += chunk.toString()));
    req.on('end', () => {
      try {
        const { message } = JSON.parse(body);
        const reply = bot.ask(message ?? '');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ reply }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request body' }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`GhostNet Support Terminal running at http://localhost:${PORT}`);
});
