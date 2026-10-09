import http from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { randomBytes, scryptSync, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { validateStandards } from './public/model.js';
import { createStore } from './storage.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const production = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || (production ? '0.0.0.0' : '127.0.0.1');
const username = process.env.ADMIN_USERNAME || '';
const password = process.env.ADMIN_PASSWORD || '';
if (production && (!username || password.length < 12)) throw new Error('Defina ADMIN_USERNAME e uma ADMIN_PASSWORD com pelo menos 12 caracteres antes de publicar.');
const store = await createStore({ root });
const salt = randomBytes(32);
const passwordHash = password ? scryptSync(password, salt, 64) : null;
const derive = promisify(scrypt);
const sessions = new Map();
const failedLogins = new Map();
let verifyingLogins = 0;
const SESSION_MS = 8 * 60 * 60 * 1000;
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };
const assets = new Map(['index.html','app.js','model.js','catalog.js','library.js','styles.css','favicon.svg'].map(name => [name, readFileSync(join(root, 'public', name))]));

function respond(res, status, value, extra = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra });
  res.end(JSON.stringify(value));
}
function session(req) {
  const token = (req.headers.cookie || '').split(';').map(c => c.trim()).find(c => c.startsWith('steffens_session='))?.slice(17);
  const record = token && sessions.get(token);
  if (!record || record.expires <= Date.now()) { if (token) sessions.delete(token); return null; }
  return { token, ...record };
}
function sameOrigin(req) {
  try {
    const origin = req.headers.origin;
    if (!origin || origin === 'null') return false;
    const parsed = new URL(origin);
    const expected = process.env.PUBLIC_ORIGIN || (production && process.env.RENDER_EXTERNAL_URL);
    return expected ? parsed.origin === new URL(expected).origin : parsed.host === req.headers.host && parsed.protocol === (production ? 'https:' : 'http:');
  } catch { return false; }
}
async function body(req, limit = 65536) {
  if (!(req.headers['content-type'] || '').startsWith('application/json')) throw Object.assign(new Error('Envie dados em JSON.'), { status: 415 });
  let chunks = [], size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error('A configuração excede o tamanho permitido.'), { status: 413 });
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Object.assign(new Error('Dados inválidos.'), { status: 400 }); }
}
function cookie(token, seconds) {
  return `steffens_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${seconds}${production ? '; Secure' : ''}`;
}
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  if (production) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method) && !sameOrigin(req)) return respond(res, 403, { error: 'Origem da solicitação não autorizada.' });
    if (req.method === 'GET' && path === '/api/health') return respond(res, 200, { ok: true });
    if (req.method === 'GET' && path === '/api/standards') return respond(res, 200, await store.read());
    if (req.method === 'GET' && path === '/api/session') {
      const auth = session(req);
      return respond(res, 200, { authenticated: !!auth, username: auth?.username || null, editingAvailable: !!passwordHash && !!username });
    }
    if (req.method === 'POST' && path === '/api/login') {
      if (!passwordHash || !username) return respond(res, 503, { error: 'O acesso de edição ainda precisa ser definido pelo responsável.' });
      const input = await body(req);
      if (!input || typeof input.username !== 'string' || typeof input.password !== 'string' || input.username.length > 100 || input.password.length > 512) return respond(res, 400, { error: 'Informe usuário e senha válidos.' });
      const source = req.socket.remoteAddress || 'local';
      const attempts = failedLogins.get(source);
      if (attempts && attempts.until > Date.now()) await new Promise(resolve => setTimeout(resolve, Math.min(2000, attempts.count * 250)));
      if (verifyingLogins >= 8) return respond(res, 503, { error: 'O acesso está ocupado. Tente novamente em alguns segundos.' }, { 'Retry-After': '3' });
      let candidate;
      verifyingLogins++;
      try { candidate = await derive(input.password, salt, 64); } finally { verifyingLogins--; }
      if (!timingSafeEqual(candidate, passwordHash) || input.username !== username) {
        if (failedLogins.size >= 1000) failedLogins.delete(failedLogins.keys().next().value);
        failedLogins.set(source, { count: (attempts?.until > Date.now() ? attempts.count : 0) + 1, until: Date.now() + 5 * 60 * 1000 });
        return respond(res, 401, { error: 'Usuário ou senha incorretos.' });
      }
      failedLogins.delete(source);
      if (sessions.size >= 100) sessions.delete(sessions.keys().next().value);
      const token = randomBytes(32).toString('hex');
      sessions.set(token, { username, expires: Date.now() + SESSION_MS });
      return respond(res, 200, { authenticated: true, username }, { 'Set-Cookie': cookie(token, SESSION_MS / 1000) });
    }
    if (req.method === 'POST' && path === '/api/logout') {
      const auth = session(req); if (auth) sessions.delete(auth.token);
      return respond(res, 200, { authenticated: false }, { 'Set-Cookie': cookie('', 0) });
    }
    if (req.method === 'PUT' && path === '/api/standards') {
      if (!session(req)) return respond(res, 401, { error: 'Entre com usuário e senha para salvar alterações.' });
      const input = await body(req, 2 * 1024 * 1024);
      if (!Number.isSafeInteger(input?.revision) || input.revision < 1) return respond(res, 400, { error: 'Revisão inválida.' });
      const existing = await store.read();
      let valid;
      try { valid = validateStandards(input, { existing }); } catch (error) { return respond(res, 400, { error: error.message }); }
      const result = await store.save(valid, input.revision, username);
      if (result.conflict) return respond(res, 409, { error: 'O padrão foi atualizado em outra sessão. Recarregue os dados antes de salvar.', current: result.conflict });
      return respond(res, 200, result.saved);
    }
    if (path.startsWith('/api/')) return respond(res, 404, { error: 'Página não encontrada.' });
    if (!['GET', 'HEAD'].includes(req.method)) return respond(res, 405, { error: 'Método não permitido.' });
    const name = path === '/' ? 'index.html' : path.slice(1);
    if (!assets.has(name)) return respond(res, 404, { error: 'Página não encontrada.' });
    const extension = name.slice(name.lastIndexOf('.'));
    res.writeHead(200, { 'Content-Type': mime[extension], 'Cache-Control': name.endsWith('.html') ? 'no-store' : 'public, max-age=3600' });
    res.end(req.method === 'HEAD' ? undefined : assets.get(name));
  } catch (error) {
    if (!res.headersSent) respond(res, error.status || 500, { error: error.status ? error.message : 'Não foi possível concluir a solicitação. Tente novamente.' });
    if (!error.status) console.error('Falha no atendimento:', error.message);
  }
});
server.requestTimeout = 15000;
server.headersTimeout = 10000;
server.listen(port, host, () => console.log(`Configurador disponível em http://${host}:${port}`));
const cleanup = setInterval(() => { for (const [token, record] of sessions) if (record.expires <= Date.now()) sessions.delete(token); for (const [source, attempts] of failedLogins) if (attempts.until <= Date.now()) failedLogins.delete(source); }, 60000);
cleanup.unref();
function shutdown() { clearInterval(cleanup); server.close(() => { store.close(); process.exit(0); }); }
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
