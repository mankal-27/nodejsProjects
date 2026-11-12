import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { hashPassword, verifyPassword, signToken, verifyToken } from '../src/crypto.js';

const SECRET = 'x'.repeat(32);
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');

describe('M1: password hashing', () => {
  it('M1: hash does not contain the password and is salted', async () => {
    const a = await hashPassword('correct horse');
    const b = await hashPassword('correct horse');
    assert.equal(typeof a, 'string');
    assert.ok(!a.includes('correct horse'));
    assert.notEqual(a, b, 'same password must produce different hashes (salt)');
  });

  it('M1: verify accepts the right password and rejects the wrong one', async () => {
    const h = await hashPassword('s3cret-pass');
    assert.equal(await verifyPassword('s3cret-pass', h), true);
    assert.equal(await verifyPassword('s3cret-pasS', h), false);
    assert.equal(await verifyPassword('', h), false);
  });

  it('M1: malformed stored hash returns false instead of throwing', async () => {
    assert.equal(await verifyPassword('x', 'garbage'), false);
    assert.equal(await verifyPassword('x', 'scrypt$$'), false);
  });
});

describe('M2: JWT', () => {
  const now = 1_700_000_000_000;

  it('M2: produces a standard HS256 JWT', () => {
    const t = signToken({ sub: 42 }, SECRET, { now, expiresInSec: 60 });
    const [h, p, s] = t.split('.');
    assert.deepEqual(JSON.parse(Buffer.from(h, 'base64url')), { alg: 'HS256', typ: 'JWT' });
    const payload = JSON.parse(Buffer.from(p, 'base64url'));
    assert.equal(payload.sub, 42);
    assert.equal(payload.iat, now / 1000);
    assert.equal(payload.exp, now / 1000 + 60);
    assert.equal(s, createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url'));
  });

  it('M2: verify round-trips the payload', () => {
    const t = signToken({ sub: 1, role: 'admin' }, SECRET, { now });
    const p = verifyToken(t, SECRET, { now: now + 1000 });
    assert.equal(p.sub, 1);
    assert.equal(p.role, 'admin');
  });

  it('M2: rejects wrong secret, tampering and garbage', () => {
    const t = signToken({ sub: 1 }, SECRET, { now });
    assert.throws(() => verifyToken(t, 'y'.repeat(32), { now }), { code: 'E_TOKEN_INVALID' });
    const [h, , s] = t.split('.');
    const forged = `${h}.${b64({ sub: 999, iat: now / 1000, exp: now / 1000 + 3600 })}.${s}`;
    assert.throws(() => verifyToken(forged, SECRET, { now }), { code: 'E_TOKEN_INVALID' });
    for (const bad of ['', 'a.b', 'a.b.c', 'not-a-token', `${t}.extra`]) {
      assert.throws(() => verifyToken(bad, SECRET, { now }), { code: 'E_TOKEN_INVALID' }, bad);
    }
  });

  it('M2: rejects alg "none"', () => {
    const t = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: 1, exp: now / 1000 + 3600 })}.`;
    assert.throws(() => verifyToken(t, SECRET, { now }), { code: 'E_TOKEN_INVALID' });
  });

  it('M2: rejects expired tokens', () => {
    const t = signToken({ sub: 1 }, SECRET, { now, expiresInSec: 10 });
    assert.throws(() => verifyToken(t, SECRET, { now: now + 11_000 }), { code: 'E_TOKEN_EXPIRED' });
  });
});
