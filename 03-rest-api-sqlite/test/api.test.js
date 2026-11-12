import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/app.js';

let server, base;
async function start(opts) {
  const s = createApp(opts);
  await new Promise((r) => s.listen(0, '127.0.0.1', r));
  return s;
}
async function stop(s) {
  s.closeAllConnections?.();
  await new Promise((r) => s.close(r));
}
const url = (p) => `http://127.0.0.1:${server.address().port}${p}`;
const json = (method, p, body, headers = {}) =>
  fetch(url(p), { method, headers: { 'content-type': 'application/json', ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
const create = (b) => json('POST', '/bookmarks', b);
let n = 0;
const sample = (extra = {}) => ({ url: `https://example.com/${++n}`, title: `Example ${n}`, ...extra });

beforeEach(async () => { if (server) await stop(server); server = await start(); });
after(async () => { if (server) await stop(server); if (base) await rm(base, { recursive: true, force: true }); });

describe('M1: routing and basic CRUD', () => {
  it('M1: GET /health', async () => {
    const r = await fetch(url('/health'));
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { status: 'ok' });
  });

  it('M1: unknown route -> 404 NOT_FOUND', async () => {
    const r = await fetch(url('/nope'));
    assert.equal(r.status, 404);
    assert.equal((await r.json()).error.code, 'NOT_FOUND');
  });

  it('M1: wrong method -> 405 with Allow', async () => {
    const r = await fetch(url('/health'), { method: 'DELETE' });
    assert.equal(r.status, 405);
    assert.match(r.headers.get('allow'), /GET/);
    assert.equal((await r.json()).error.code, 'METHOD_NOT_ALLOWED');
  });

  it('M1: POST creates a bookmark (201 + Location)', async () => {
    const r = await create({ url: 'https://nodejs.org', title: ' Node ', tags: ['js', 'runtime'] });
    assert.equal(r.status, 201);
    const b = await r.json();
    assert.equal(typeof b.id, 'number');
    assert.equal(b.url, 'https://nodejs.org');
    assert.equal(b.title, 'Node');
    assert.deepEqual(b.tags, ['js', 'runtime']);
    assert.ok(!Number.isNaN(Date.parse(b.createdAt)));
    assert.equal(r.headers.get('location'), `/bookmarks/${b.id}`);
  });

  it('M1: tags default to []', async () => {
    const b = await (await create(sample())).json();
    assert.deepEqual(b.tags, []);
  });

  it('M1: GET /bookmarks/:id returns it; unknown and non-numeric ids -> 404', async () => {
    const b = await (await create(sample())).json();
    const r = await fetch(url(`/bookmarks/${b.id}`));
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), b);
    assert.equal((await fetch(url('/bookmarks/99999'))).status, 404);
    assert.equal((await fetch(url('/bookmarks/abc'))).status, 404);
  });
});

describe('M2: body parsing and validation', () => {
  it('M2: invalid JSON -> 400 BAD_JSON', async () => {
    const r = await fetch(url('/bookmarks'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"url":' });
    assert.equal(r.status, 400);
    assert.equal((await r.json()).error.code, 'BAD_JSON');
  });

  it('M2: wrong content-type -> 415', async () => {
    const r = await fetch(url('/bookmarks'), { method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'hi' });
    assert.equal(r.status, 415);
    assert.equal((await r.json()).error.code, 'UNSUPPORTED_MEDIA_TYPE');
  });

  it('M2: content-type with charset is accepted', async () => {
    const r = await create(sample());
    const r2 = await json('POST', '/bookmarks', sample(), { 'content-type': 'application/json; charset=utf-8' });
    assert.equal(r.status, 201);
    assert.equal(r2.status, 201);
  });

  it('M2: body over 1 MiB -> 413', async () => {
    const big = JSON.stringify({ url: 'https://x.com', title: 'x', pad: 'a'.repeat(1024 * 1024 + 10) });
    const status = await new Promise((resolve, reject) => {
      const req = http.request(url('/bookmarks'), { method: 'POST', headers: { 'content-type': 'application/json' } }, (res) => { res.resume(); resolve(res.statusCode); });
      req.on('error', (e) => (e.code === 'ECONNRESET' || e.code === 'EPIPE' ? resolve('reset') : reject(e)));
      req.end(big);
    });
    assert.equal(status, 413);
  });

  for (const [name, body] of [
    ['missing url', { title: 'x' }],
    ['non-http url', { url: 'ftp://x.com', title: 'x' }],
    ['garbage url', { url: 'not a url', title: 'x' }],
    ['empty title', { url: 'https://x.com', title: '   ' }],
    ['title too long', { url: 'https://x.com', title: 'a'.repeat(201) }],
    ['tags not array', { url: 'https://x.com', title: 'x', tags: 'js' }],
    ['empty tag', { url: 'https://x.com', title: 'x', tags: [''] }],
    ['too many tags', { url: 'https://x.com', title: 'x', tags: Array.from({ length: 11 }, (_, i) => `t${i}`) }],
    ['body is an array', [1, 2]],
  ]) {
    it(`M2: validation rejects ${name}`, async () => {
      const r = await create(body);
      assert.equal(r.status, 400);
      const e = (await r.json()).error;
      assert.equal(e.code, 'VALIDATION');
      assert.equal(typeof e.message, 'string');
    });
  }
});

describe('M3: listing and pagination', () => {
  it('M3: empty list', async () => {
    const r = await fetch(url('/bookmarks'));
    assert.deepEqual(await r.json(), { items: [], nextCursor: null });
  });

  it('M3: pages through 25 items with limit=10', async () => {
    for (let i = 0; i < 25; i++) await create(sample());
    const seen = [];
    let cursor = null, pages = 0;
    do {
      const q = new URLSearchParams({ limit: '10', ...(cursor ? { cursor } : {}) });
      const page = await (await fetch(url(`/bookmarks?${q}`))).json();
      seen.push(...page.items.map((b) => b.id));
      cursor = page.nextCursor;
      pages++;
    } while (cursor && pages < 10);
    assert.equal(pages, 3);
    assert.equal(seen.length, 25);
    assert.deepEqual(seen, [...seen].sort((a, b) => a - b), 'ordered by id asc');
    assert.equal(new Set(seen).size, 25, 'no duplicates');
  });

  it('M3: default limit is 20', async () => {
    for (let i = 0; i < 21; i++) await create(sample());
    const page = await (await fetch(url('/bookmarks'))).json();
    assert.equal(page.items.length, 20);
    assert.equal(typeof page.nextCursor, 'string');
  });

  it('M3: invalid limit -> 400', async () => {
    for (const l of ['0', '101', 'abc', '-1']) {
      assert.equal((await fetch(url(`/bookmarks?limit=${l}`))).status, 400, `limit=${l}`);
    }
  });

  it('M3: filters by tag', async () => {
    await create(sample({ tags: ['js'] }));
    await create(sample({ tags: ['py'] }));
    await create(sample({ tags: ['js', 'db'] }));
    const page = await (await fetch(url('/bookmarks?tag=js'))).json();
    assert.equal(page.items.length, 2);
    assert.ok(page.items.every((b) => b.tags.includes('js')));
  });

  it('M3: SQL injection in tag is harmless', async () => {
    await create(sample({ tags: ['js'] }));
    const r = await fetch(url(`/bookmarks?tag=${encodeURIComponent("js' OR '1'='1")}`));
    assert.equal(r.status, 200);
    assert.deepEqual((await r.json()).items, []);
  });
});

describe('M4: update, delete, conflicts, persistence', () => {
  it('M4: PATCH updates provided fields only', async () => {
    const b = await (await create(sample({ tags: ['a'] }))).json();
    const r = await json('PATCH', `/bookmarks/${b.id}`, { title: 'Renamed' });
    assert.equal(r.status, 200);
    const u = await r.json();
    assert.equal(u.title, 'Renamed');
    assert.equal(u.url, b.url);
    assert.deepEqual(u.tags, ['a']);
    assert.deepEqual(await (await fetch(url(`/bookmarks/${b.id}`))).json(), u);
  });

  it('M4: PATCH validates and 404s', async () => {
    const b = await (await create(sample())).json();
    assert.equal((await json('PATCH', `/bookmarks/${b.id}`, { url: 'nope' })).status, 400);
    assert.equal((await json('PATCH', '/bookmarks/99999', { title: 'x' })).status, 404);
  });

  it('M4: DELETE -> 204 then 404', async () => {
    const b = await (await create(sample())).json();
    const r = await fetch(url(`/bookmarks/${b.id}`), { method: 'DELETE' });
    assert.equal(r.status, 204);
    assert.equal(await r.text(), '');
    assert.equal((await fetch(url(`/bookmarks/${b.id}`), { method: 'DELETE' })).status, 404);
  });

  it('M4: duplicate url -> 409 CONFLICT (POST and PATCH)', async () => {
    const a = await (await create({ url: 'https://dup.com', title: 'a' })).json();
    const r = await create({ url: 'https://dup.com', title: 'b' });
    assert.equal(r.status, 409);
    assert.equal((await r.json()).error.code, 'CONFLICT');
    const other = await (await create(sample())).json();
    assert.equal((await json('PATCH', `/bookmarks/${other.id}`, { url: a.url })).status, 409);
  });

  it('M4: data persists across restarts with a file db', async () => {
    base = await mkdtemp(join(tmpdir(), 'api-'));
    const dbPath = join(base, 'test.db');
    await stop(server);
    server = await start({ dbPath });
    const b = await (await create(sample())).json();
    await stop(server);
    server = await start({ dbPath });
    assert.deepEqual(await (await fetch(url(`/bookmarks/${b.id}`))).json(), b);
  });
});
