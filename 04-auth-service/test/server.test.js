import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createAuthServer } from '../src/server.js';

const SECRET = 'test-secret-'.repeat(4);
let server, dir, dbPath, clock;
const url = (p) => `http://127.0.0.1:${server.address().port}${p}`;
const post = (p, body) => fetch(url(p), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
const me = (token) => fetch(url('/me'), { headers: token === undefined ? {} : { authorization: `Bearer ${token}` } });

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'auth-'));
  dbPath = join(dir, 'auth.db');
  clock = 1_700_000_000_000;
  server = createAuthServer({ secret: SECRET, dbPath, now: () => clock });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
});
afterEach(async () => {
  if (server?.listening) { server.closeAllConnections(); await new Promise((r) => server.close(r)); }
  await rm(dir, { recursive: true, force: true });
});

describe('M3: signup / login / me', () => {
  it('M3: signup returns 201 {id, email} and normalises email', async () => {
    const r = await post('/signup', { email: '  Ada@Example.COM ', password: 'password123' });
    assert.equal(r.status, 201);
    const body = await r.json();
    assert.equal(body.email, 'ada@example.com');
    assert.ok(body.id !== undefined);
    assert.equal(body.password, undefined);
    assert.equal(body.password_hash, undefined);
  });

  it('M3: stores a hash, not the password', async () => {
    await post('/signup', { email: 'a@b.co', password: 'password123' });
    const db = new DatabaseSync(dbPath, { readOnly: true });
    const row = db.prepare('SELECT password_hash FROM users WHERE email = ?').get('a@b.co');
    db.close();
    assert.ok(row.password_hash);
    assert.ok(!row.password_hash.includes('password123'));
  });

  it('M3: signup validation and duplicates', async () => {
    assert.equal((await post('/signup', { email: 'nope', password: 'password123' })).status, 400);
    assert.equal((await post('/signup', { email: 'a@b.co', password: 'short' })).status, 400);
    assert.equal((await post('/signup', { email: 'a@b.co' })).status, 400);
    assert.equal((await post('/signup', { email: 'a@b.co', password: 'password123' })).status, 201);
    const dup = await post('/signup', { email: 'A@B.CO', password: 'password123' });
    assert.equal(dup.status, 409);
    assert.equal((await dup.json()).error.code, 'CONFLICT');
  });

  it('M3: login returns a token usable on /me', async () => {
    await post('/signup', { email: 'a@b.co', password: 'password123' });
    const r = await post('/login', { email: 'a@b.co', password: 'password123' });
    assert.equal(r.status, 200);
    const { token } = await r.json();
    assert.equal(token.split('.').length, 3);
    const m = await me(token);
    assert.equal(m.status, 200);
    assert.equal((await m.json()).email, 'a@b.co');
  });

  it('M3: wrong password and unknown user give identical 401s', async () => {
    await post('/signup', { email: 'a@b.co', password: 'password123' });
    const wrong = await post('/login', { email: 'a@b.co', password: 'wrongpass1' });
    const unknown = await post('/login', { email: 'ghost@b.co', password: 'password123' });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.deepEqual(await wrong.json(), await unknown.json());
  });

  it('M3: /me rejects missing, malformed, forged and expired tokens', async () => {
    await post('/signup', { email: 'a@b.co', password: 'password123' });
    const { token } = await (await post('/login', { email: 'a@b.co', password: 'password123' })).json();
    assert.equal((await me()).status, 401);
    assert.equal((await me('garbage')).status, 401);
    assert.equal((await fetch(url('/me'), { headers: { authorization: `Basic ${token}` } })).status, 401);
    assert.equal((await me(token.slice(0, -2) + 'xx')).status, 401);
    clock += 2 * 60 * 60 * 1000; // 2 hours later; default expiry is 1 hour
    const expired = await me(token);
    assert.equal(expired.status, 401);
    assert.equal((await expired.json()).error.code, 'UNAUTHORIZED');
  });
});

describe('M4: rate limiting', () => {
  it('M4: 6th attempt after 5 failures is 429, even with the right password', async () => {
    await post('/signup', { email: 'a@b.co', password: 'password123' });
    for (let i = 0; i < 5; i++) {
      assert.equal((await post('/login', { email: 'a@b.co', password: 'nope-nope' })).status, 401, `attempt ${i + 1}`);
    }
    const r = await post('/login', { email: 'a@b.co', password: 'password123' });
    assert.equal(r.status, 429);
    assert.equal((await r.json()).error.code, 'RATE_LIMITED');
    const ra = Number(r.headers.get('retry-after'));
    assert.ok(Number.isInteger(ra) && ra > 0 && ra <= 900, `Retry-After=${ra}`);
  });

  it('M4: limits are per email', async () => {
    await post('/signup', { email: 'a@b.co', password: 'password123' });
    await post('/signup', { email: 'c@d.co', password: 'password123' });
    for (let i = 0; i < 5; i++) await post('/login', { email: 'a@b.co', password: 'nope-nope' });
    assert.equal((await post('/login', { email: 'c@d.co', password: 'password123' })).status, 200);
  });

  it('M4: window resets after 15 minutes', async () => {
    await post('/signup', { email: 'a@b.co', password: 'password123' });
    for (let i = 0; i < 5; i++) await post('/login', { email: 'a@b.co', password: 'nope-nope' });
    assert.equal((await post('/login', { email: 'a@b.co', password: 'password123' })).status, 429);
    clock += 15 * 60 * 1000 + 1;
    assert.equal((await post('/login', { email: 'a@b.co', password: 'password123' })).status, 200);
  });
});
