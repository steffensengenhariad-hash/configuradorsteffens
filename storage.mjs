import { mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { INITIAL_DIMENSIONS, SCHEMA_VERSION, normalizeStandards, validateStandards } from './public/model.js';
import { ATTACHMENT_LIMITS } from './public/model.js';
import { attachmentMetadata } from './attachments.mjs';

const SCHEMA = [
  'CREATE TABLE IF NOT EXISTS standards (id INTEGER PRIMARY KEY CHECK (id = 1), revision INTEGER NOT NULL, body TEXT NOT NULL, updated_at TEXT, updated_by TEXT)',
  'CREATE TABLE IF NOT EXISTS revisions (revision INTEGER PRIMARY KEY, body TEXT NOT NULL, updated_at TEXT NOT NULL, updated_by TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS attachments (id TEXT PRIMARY KEY, name TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, created_at TEXT NOT NULL, data TEXT NOT NULL)',
];
const SEED = JSON.stringify(normalizeStandards({ dimensions: INITIAL_DIMENSIONS, clearances: [] }));
const READ = 'SELECT * FROM standards WHERE id = 1';
const UPDATE = 'UPDATE standards SET revision = revision + 1, body = ?, updated_at = ?, updated_by = ? WHERE id = 1 AND revision = ?';
const ARCHIVE = 'INSERT INTO revisions (revision,body,updated_at,updated_by) VALUES (?,?,?,?)';
const ATTACHMENT_COLUMNS = 'id,name,mime,size,created_at';
const INSERT_ATTACHMENT = 'INSERT INTO attachments (id,name,mime,size,created_at,data) VALUES (?,?,?,?,?,?)';
const attachmentArgs = file => [file.id,file.name,file.mime,file.size,file.createdAt,file.data];
function canonicalizeAttachments(valid, rows) {
  const available = new Map(rows.map(row => [row.id, attachmentMetadata(row)]));
  for (const fitting of valid.fittings) fitting.attachments = fitting.attachments.map(ref => {
    if (!available.has(ref.id)) throw Object.assign(new Error('Um anexo não está disponível neste banco. Envie o arquivo novamente antes de salvar.'), { status: 400 });
    return available.get(ref.id);
  });
  return valid;
}
function attachmentLookup(valid) {
  const ids = [...new Set(valid.fittings.flatMap(fitting => fitting.attachments.map(ref => ref.id)))];
  return { ids, sql: `SELECT ${ATTACHMENT_COLUMNS} FROM attachments WHERE id IN (${ids.map(() => '?').join(',')})` };
}
function enforceAttachmentBudget(size, file) {
  if (Number(size) + file.size > ATTACHMENT_LIMITS.totalBytes) throw Object.assign(new Error('O espaço de anexos deste configurador atingiu 100 MiB. Revise o acervo antes de enviar novos arquivos.'), { status: 413 });
}

function snapshot(row) {
  if (!row) throw new Error('Padrão inicial indisponível.');
  const revision = Number(row.revision);
  if (!Number.isSafeInteger(revision)) throw new Error('Revisão do banco inválida.');
  return { schemaVersion: SCHEMA_VERSION, unit: 'cm', revision, ...normalizeStandards(JSON.parse(row.body)), updatedAt: row.updated_at, updatedBy: row.updated_by };
}
function unavailable() {
  return Object.assign(new Error('Não foi possível acessar os padrões salvos. Tente novamente; suas alterações ainda não salvas permanecem nesta tela.'), { status: 503 });
}
function encode(value) {
  if (value === null) return { type: 'null' };
  if (typeof value === 'string') return { type: 'text', value };
  if (typeof value === 'number' && Number.isFinite(value)) return Number.isSafeInteger(value) ? { type: 'integer', value: String(value) } : { type: 'float', value };
  throw new Error('Parâmetro SQL inválido.');
}
function decode(value) {
  if (value.type === 'null') return null;
  if (value.type === 'text' || value.type === 'float') return value.value;
  if (value.type === 'integer') { const n = Number(value.value); return Number.isSafeInteger(n) ? n : value.value; }
  throw new Error('Tipo de resultado SQL inesperado.');
}
function databaseOrigin(input, production) {
  const url = new URL(input.replace(/^(libsql|turso):\/\//, 'https://'));
  const localTest = !production && url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  if ((!localTest && url.protocol !== 'https:') || url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) throw new Error('TURSO_DATABASE_URL deve ser a URL HTTPS, libsql:// ou turso:// do banco, sem credenciais na URL.');
  return url.origin;
}

export async function createStore({ env = process.env, root, fetchImpl = globalThis.fetch } = {}) {
  const production = env.NODE_ENV === 'production';
  const remote = !!env.TURSO_DATABASE_URL;
  if (remote && !env.TURSO_AUTH_TOKEN) throw new Error('Defina TURSO_AUTH_TOKEN para acessar o banco compartilhado.');
  if (!remote && env.TURSO_AUTH_TOKEN) throw new Error('Defina TURSO_DATABASE_URL junto com o token do banco.');
  if (production && !remote) throw new Error('Defina TURSO_DATABASE_URL e TURSO_AUTH_TOKEN. O Render gratuito não mantém bancos locais após reiniciar.');
  if (!remote) {
    const { DatabaseSync } = await import('node:sqlite');
    const dataDir = resolve(env.DATA_DIR || join(root, 'data'));
    mkdirSync(dataDir, { recursive: true });
    const database = new DatabaseSync(join(dataDir, 'steffens.sqlite'));
    database.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000');
    for (const sql of SCHEMA) database.exec(sql);
    database.prepare('INSERT OR IGNORE INTO standards (id,revision,body) VALUES (1,1,?)').run(SEED);
    const read = database.prepare(READ), update = database.prepare(UPDATE), archive = database.prepare(ARCHIVE);
    return {
      kind: 'local',
      async read() { return snapshot(read.get()); },
      async save(valid, revision, username) {
        const stamp = new Date().toISOString();
        database.exec('BEGIN IMMEDIATE');
        try {
          const before = snapshot(read.get());
          if (before.revision !== revision) { database.exec('ROLLBACK'); return { conflict: before }; }
          const finalValid = validateStandards(valid, { existing: before });
          const lookup = attachmentLookup(finalValid);
          canonicalizeAttachments(finalValid, lookup.ids.length ? database.prepare(lookup.sql).all(...lookup.ids) : []);
          const serialized = JSON.stringify(finalValid);
          if (update.run(serialized, stamp, username, revision).changes !== 1) throw new Error('Conflito durante o salvamento.');
          archive.run(revision + 1, serialized, stamp, username);
          const result = snapshot(read.get());
          database.exec('COMMIT'); return { saved: result };
        } catch (error) { database.exec('ROLLBACK'); throw error; }
      },
      async uploadAttachment(file) {
        database.exec('BEGIN IMMEDIATE');
        try {
          enforceAttachmentBudget(database.prepare('SELECT COALESCE(SUM(size),0) AS total FROM attachments').get().total, file);
          database.prepare(INSERT_ATTACHMENT).run(...attachmentArgs(file));
          database.exec('COMMIT'); return attachmentMetadata({ ...file, created_at: file.createdAt });
        } catch (error) { database.exec('ROLLBACK'); throw error; }
      },
      async readAttachment(id) {
        const row = database.prepare('SELECT * FROM attachments WHERE id = ?').get(id);
        return row ? { ...attachmentMetadata(row), data: row.data } : null;
      },
      async attachmentInfo(id) { return attachmentMetadata(database.prepare(`SELECT ${ATTACHMENT_COLUMNS} FROM attachments WHERE id = ?`).get(id)); },
      close() { database.close(); },
    };
  }

  const origin = databaseOrigin(env.TURSO_DATABASE_URL, production);
  const token = env.TURSO_AUTH_TOKEN;
  function stream() {
    let baton = null, base = `${origin}/`, closed = false;
    async function pipeline(requests, timeout = 7000) {
      if (closed) throw unavailable();
      let response, content;
      try {
        response = await fetchImpl(new URL('v2/pipeline', base), {
          method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ baton, requests }), signal: AbortSignal.timeout(timeout), redirect: 'error',
        });
        if (!response.ok) { closed = true; throw unavailable(); }
        content = await response.json();
      } catch { throw unavailable(); }
      if (!content || !Object.hasOwn(content, 'baton') || !(content.baton === null || (typeof content.baton === 'string' && content.baton.length > 0))) {
        closed = true; throw unavailable();
      }
      baton = content.baton;
      if (content.base_url) {
        try {
          const next = new URL(content.base_url);
          const allowedTurso = next.protocol === 'https:' && next.hostname.endsWith('.turso.io') && new URL(origin).hostname.endsWith('.turso.io');
          if (next.origin !== origin && !allowedTurso) throw new Error('Origem inválida.');
          if (next.username || next.password || next.search || next.hash) throw new Error('Origem inválida.');
          base = next.href;
        } catch { closed = true; throw unavailable(); }
      }
      if (baton === null) closed = true;
      if (!Array.isArray(content.results) || content.results.length !== requests.length || content.results.some(item => item.type !== 'ok')) throw unavailable();
      return content.results.map(item => item.response);
    }
    return {
      async execute(sql, args = [], { close = false, timeout = 7000 } = {}) {
        const requests = [{ type: 'execute', stmt: { sql, args: args.map(encode), want_rows: true } }];
        if (close) requests.push({ type: 'close' });
        const responses = await pipeline(requests, timeout), result = responses[0]?.result;
        if (responses[0]?.type !== 'execute' || !result || !Array.isArray(result.cols) || !Array.isArray(result.rows)) throw unavailable();
        if (close && responses[1]?.type !== 'close') throw unavailable();
        const rows = result.rows.map(row => Object.fromEntries(result.cols.map((column, index) => [column.name, decode(row[index])])));
        return { rows, changes: result.affected_row_count };
      },
      async close() { if (!closed && baton !== null) await pipeline([{ type: 'close' }], 2000); },
    };
  }
  async function execute(sql, args = []) {
    const connection = stream();
    try { return await connection.execute(sql, args, { close: true }); }
    finally { await connection.close().catch(() => {}); }
  }
  for (const sql of SCHEMA) await execute(sql);
  await execute('INSERT OR IGNORE INTO standards (id,revision,body) VALUES (1,1,?)', [SEED]);
  return {
    kind: 'turso',
    async read() { return snapshot((await execute(READ)).rows[0]); },
    async save(valid, revision, username) {
      const stamp = new Date().toISOString(), connection = stream();
      let started = false, committed = false, commitAttempted = false;
      const deadline = Date.now() + 4500;
      const run = (sql, args = [], options = {}) => {
        const remaining = deadline - Date.now();
        if (remaining <= 0) throw unavailable();
        return connection.execute(sql, args, { timeout: remaining, ...options });
      };
      try {
        await run('BEGIN IMMEDIATE'); started = true;
        const before = snapshot((await run(READ)).rows[0]);
        if (before.revision !== revision) {
          await run('ROLLBACK', [], { close: true }); started = false;
          return { conflict: before };
        }
        const finalValid = validateStandards(valid, { existing: before });
        const lookup = attachmentLookup(finalValid);
        canonicalizeAttachments(finalValid, lookup.ids.length ? (await run(lookup.sql, lookup.ids)).rows : []);
        const serialized = JSON.stringify(finalValid);
        const changed = await run(UPDATE, [serialized, stamp, username, revision]);
        if (changed.changes !== 1) throw unavailable();
        await run(ARCHIVE, [revision + 1, serialized, stamp, username]);
        commitAttempted = true;
        await run('COMMIT', [], { close: true }); committed = true;
        return { saved: { schemaVersion: SCHEMA_VERSION, unit: 'cm', revision: revision + 1, ...finalValid, updatedAt: stamp, updatedBy: username } };
      } catch (error) {
        if (started && !committed && !commitAttempted) await connection.execute('ROLLBACK', [], { close: true, timeout: 2000 }).catch(() => {});
        throw error;
      } finally { await connection.close().catch(() => {}); }
    },
    async uploadAttachment(file) {
      const connection = stream(); let started = false, commitAttempted = false;
      try {
        await connection.execute('BEGIN IMMEDIATE'); started = true;
        enforceAttachmentBudget((await connection.execute('SELECT COALESCE(SUM(size),0) AS total FROM attachments')).rows[0].total, file);
        await connection.execute(INSERT_ATTACHMENT, attachmentArgs(file), { timeout: 20000 });
        commitAttempted = true; await connection.execute('COMMIT', [], { close: true });
        return attachmentMetadata({ ...file, created_at: file.createdAt });
      } catch (error) {
        if (started && !commitAttempted) await connection.execute('ROLLBACK', [], { close: true, timeout: 2000 }).catch(() => {});
        throw error;
      } finally { await connection.close().catch(() => {}); }
    },
    async readAttachment(id) {
      const row = (await execute('SELECT * FROM attachments WHERE id = ?', [id])).rows[0];
      return row ? { ...attachmentMetadata(row), data: row.data } : null;
    },
    async attachmentInfo(id) { return attachmentMetadata((await execute(`SELECT ${ATTACHMENT_COLUMNS} FROM attachments WHERE id = ?`, [id])).rows[0]); },
    close() {},
  };
}
