import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  checkStatus, 
  solveError, 
  explainError, 
  generateFix, 
  sendDebugSession, 
  postBugReport 
} from '../api.js';
import { getConfig, setToken, setEndpoint } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

/**
 * Parses JSON body from incoming HTTP request.
 */
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      // 5MB safeguard limit
      if (raw.length > 5 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error(`Invalid JSON: ${err.message}`));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Sends a JSON response with CORS headers.
 */
function sendJson(res, statusCode, data) {
  const json = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(json);
}

/**
 * Serves a static file from src/ui/public.
 */
async function serveStaticFile(reqPath, res) {
  let safePath = reqPath === '/' ? '/index.html' : reqPath;
  const filePath = path.join(PUBLIC_DIR, safePath);

  // Security: ensure requested path is inside PUBLIC_DIR
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      return serveStaticFile(path.join(safePath, 'index.html'), res);
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = await fs.readFile(filePath);

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    res.end(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File Not Found');
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Internal Server Error: ${err.message}`);
    }
  }
}

/**
 * Request handler for the Window Utility Tool local HTTP server.
 */
async function requestHandler(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  // --- API Endpoints ---
  if (pathname.startsWith('/api/')) {
    try {
      if (req.method === 'GET' && pathname === '/api/status') {
        const status = await checkStatus();
        return sendJson(res, 200, status);
      }

      if (req.method === 'GET' && pathname === '/api/config') {
        const cfg = getConfig();
        return sendJson(res, 200, cfg);
      }

      if (req.method === 'POST' && pathname === '/api/config') {
        const body = await parseJsonBody(req);
        if (body.token !== undefined) setToken(body.token);
        if (body.endpoint) setEndpoint(body.endpoint);
        return sendJson(res, 200, { success: true, config: getConfig() });
      }

      if (req.method === 'POST' && pathname === '/api/solve') {
        const body = await parseJsonBody(req);
        const result = await solveError(body);
        return sendJson(res, 200, result);
      }

      if (req.method === 'POST' && pathname === '/api/explain') {
        const body = await parseJsonBody(req);
        const result = await explainError(body);
        return sendJson(res, 200, result);
      }

      if (req.method === 'POST' && pathname === '/api/fix') {
        const body = await parseJsonBody(req);
        const result = await generateFix(body);
        return sendJson(res, 200, result);
      }

      if (req.method === 'POST' && pathname === '/api/session') {
        const body = await parseJsonBody(req);
        const result = await sendDebugSession(body);
        return sendJson(res, 200, result);
      }

      if (req.method === 'POST' && pathname === '/api/log') {
        const body = await parseJsonBody(req);
        const result = await postBugReport(body);
        return sendJson(res, 200, result);
      }

      return sendJson(res, 404, { error: `Endpoint not found: ${pathname}` });
    } catch (err) {
      return sendJson(res, 500, { error: err.message || 'Internal Server Error' });
    }
  }

  // --- Static Files ---
  await serveStaticFile(pathname, res);
}

/**
 * Starts the local HTTP workstation server on the specified or next available port.
 */
export function startWorkstationServer({ port = 4567, host = '127.0.0.1' } = {}) {
  return new Promise((resolve, reject) => {
    let currentPort = port;
    const maxPort = port + 20;

    function tryListen() {
      const server = http.createServer(requestHandler);

      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE' && currentPort < maxPort) {
          currentPort++;
          tryListen();
        } else {
          reject(err);
        }
      });

      server.once('listening', () => {
        const address = server.address();
        const actualPort = typeof address === 'object' ? address.port : currentPort;
        const url = `http://${host}:${actualPort}`;
        resolve({
          server,
          port: actualPort,
          url,
          close: () => new Promise(cb => server.close(cb))
        });
      });

      server.listen(currentPort, host);
    }

    tryListen();
  });
}
