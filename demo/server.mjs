// Tiny zero-dependency static server for the demo page.
// Run it on its own with `npm run serve`, then open http://localhost:4173
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT ?? 4173);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

createServer(async (req, res) => {
  const urlPath = new URL(req.url, 'http://localhost').pathname;
  const relative = normalize(urlPath === '/' ? '/index.html' : urlPath).replace(/^([/\\])+/, '');
  if (relative.startsWith('..')) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const body = await readFile(join(root, relative));
    res.writeHead(200, { 'Content-Type': types[extname(relative)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
  }
}).listen(port, () => {
  console.log(`Demo page running at http://localhost:${port}`);
});
