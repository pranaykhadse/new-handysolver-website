import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(process.cwd(), 'dist', 'client');
const ROOT2 = path.join(process.cwd(), 'dist', 'server', 'ssr');
const TARGET = 'http://127.0.0.1:3002';
const PORT = 3000;

// Discover built chunk hashes from dist/client at startup
const clientAssets = fs.readdirSync(path.join(ROOT, 'assets'));
const builtPageCSS  = clientAssets.find(f => /^page-[A-Za-z0-9_-]+\.css$/.test(f)) || '';
const builtPageJS   = clientAssets.find(f => /^page-[A-Za-z0-9_-]+\.js$/.test(f)) || '';
const builtIndexCSS = clientAssets.find(f => /^index-[A-Za-z0-9_-]+\.css$/.test(f)) || '';
const builtIndexJS  = clientAssets.find(f => /^index-[A-Za-z0-9_-]+\.js$/.test(f)) || '';
console.log(`[fix-server] page chunk: ${builtPageCSS} / ${builtPageJS}`);
console.log(`[fix-server] index chunk: ${builtIndexCSS} / ${builtIndexJS}`);

const MIME = {
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.html': 'text/html; charset=utf-8',
};

function contentType(p) {
  return MIME[path.extname(p).toLowerCase()] || 'application/octet-stream';
}

function tryFile(filePath, root) {
  if (!filePath.startsWith(root)) return null;
  try { if (fs.statSync(filePath).isFile()) return filePath; } catch {}
  return null;
}

// Patch HTML/script responses: replace any chunk references with the built versions
function patchPageChunks(text) {
  if (builtPageCSS)  text = text.replace(/page-[A-Za-z0-9_-]+\.css/g,  builtPageCSS);
  if (builtPageJS)   text = text.replace(/page-[A-Za-z0-9_-]+\.js/g,   builtPageJS);
  if (builtIndexCSS) text = text.replace(/index-[A-Za-z0-9_-]+\.css/g, builtIndexCSS);
  if (builtIndexJS)  text = text.replace(/index-[A-Za-z0-9_-]+\.js/g,  builtIndexJS);
  return text;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = decodeURIComponent(url.pathname);

    // Serve static assets from dist/client (primary) or dist/server/ssr (fallback)
    if (pathname !== '/' && !pathname.startsWith('/api/') && !pathname.startsWith('/_next') && !pathname.startsWith('/_vinext')) {
      const resolved =
        tryFile(path.join(ROOT, pathname), ROOT) ||
        tryFile(path.join(ROOT2, pathname), ROOT2);
      if (resolved) {
        const data = fs.readFileSync(resolved);
        res.writeHead(200, {
          'Content-Type': contentType(resolved),
          'Content-Length': data.length,
          'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
        });
        res.end(data);
        return;
      }
    }

    // Rewrite /login → /admin so the SPA handles auth state on refresh
    const proxyPath = req.url === '/login' || req.url.startsWith('/login?') ? '/admin' : req.url;

    // Proxy to vinext, patching page chunk references in HTML/script responses
    const targetUrl = TARGET + proxyPath;
    const headers = { ...req.headers };
    delete headers.host;
    delete headers.connection;
    // Tell vinext not to compress responses — the proxy reads raw bytes/text
    // and cannot decompress gzip on the fly, which produces garbled output.
    delete headers['accept-encoding'];

    const body = req.method !== 'GET' && req.method !== 'HEAD'
      ? await new Promise((resolve, reject) => {
          const chunks = [];
          req.on('data', c => chunks.push(c));
          req.on('end', () => resolve(Buffer.concat(chunks)));
          req.on('error', reject);
        })
      : undefined;

    const fetchRes = await fetch(targetUrl, { method: req.method, headers, body, redirect: 'manual' });
    const ct = fetchRes.headers.get('content-type') || '';

    // Forward Set-Cookie and other important headers from the upstream response
    function buildResHeaders(extra = {}) {
      const out = { 'Cache-Control': 'no-cache', ...extra };
      // Forward all Set-Cookie headers
      const setCookies = fetchRes.headers.getSetCookie?.() ?? [];
      if (setCookies.length) out['Set-Cookie'] = setCookies;
      // Forward Location for redirects
      const loc = fetchRes.headers.get('location');
      if (loc) out['Location'] = loc;
      return out;
    }

    // Patch HTML and inline script responses so page chunk hashes match dist/client
    if (ct.includes('text/html') || ct.includes('text/javascript') || ct.includes('application/javascript')) {
      let text = await fetchRes.text();
      text = patchPageChunks(text);
      const buf = Buffer.from(text, 'utf-8');
      res.writeHead(fetchRes.status, buildResHeaders({
        'Content-Type': ct || 'text/html; charset=utf-8',
        'Content-Length': buf.length,
      }));
      res.end(buf);
    } else {
      const respBody = Buffer.from(await fetchRes.arrayBuffer());
      res.writeHead(fetchRes.status, buildResHeaders({
        'Content-Type': ct || 'application/octet-stream',
        'Content-Length': respBody.length,
      }));
      res.end(respBody);
    }
  } catch (e) {
    console.error(e);
    res.writeHead(502); res.end('Proxy error: ' + e.message);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`fix-server on :${PORT} → vinext on ${TARGET} | page CSS: ${builtPageCSS} | page JS: ${builtPageJS}`);
});
