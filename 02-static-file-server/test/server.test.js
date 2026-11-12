import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { createStaticServer } from '../src/server.js';

let base, root, server, port;
const TEXT = 'Hello, static world!\n'.repeat(50); // 1050 bytes

/** Raw request helper. Sends the path verbatim (no normalisation, unlike fetch). */
function request(path, { method = 'GET', headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path, method, headers }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.end();
  });
}

before(async () => {
  base = await mkdtemp(join(tmpdir(), 'static-'));
  root = join(base, 'public');
  await mkdir(join(root, 'sub'), { recursive: true });
  await mkdir(join(root, 'empty'));
  await writeFile(join(root, 'index.html'), '<h1>home</h1>');
  await writeFile(join(root, 'hello.txt'), TEXT);
  await writeFile(join(root, 'style.css'), 'body{}');
  await writeFile(join(root, 'data.json'), '{"a":1}');
  await writeFile(join(root, 'blob.bin'), Buffer.from([1, 2, 3]));
  await writeFile(join(root, 'sub', 'index.html'), '<h1>sub</h1>');
  await writeFile(join(base, 'secret.txt'), 'TOP SECRET');
  server = createStaticServer({ root });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  port = server.address().port;
});
after(async () => {
  server?.closeAllConnections?.();
  await new Promise((r) => (server ? server.close(r) : r()));
  await rm(base, { recursive: true, force: true });
});

describe('M1: serving files', () => {
  it('M1: serves a text file with correct headers', async () => {
    const r = await request('/hello.txt');
    assert.equal(r.status, 200);
    assert.equal(r.headers['content-type'], 'text/plain; charset=utf-8');
    assert.equal(r.headers['content-length'], String(Buffer.byteLength(TEXT)));
    assert.equal(r.body.toString(), TEXT);
  });

  it('M1: MIME types', async () => {
    assert.equal((await request('/style.css')).headers['content-type'], 'text/css; charset=utf-8');
    assert.equal((await request('/data.json')).headers['content-type'], 'application/json');
    assert.equal((await request('/blob.bin')).headers['content-type'], 'application/octet-stream');
  });

  it('M1: / serves index.html; /sub/ serves sub/index.html', async () => {
    const r = await request('/');
    assert.equal(r.status, 200);
    assert.equal(r.body.toString(), '<h1>home</h1>');
    assert.equal((await request('/sub/')).body.toString(), '<h1>sub</h1>');
  });

  it('M1: missing file and dir without index -> 404', async () => {
    assert.equal((await request('/nope.txt')).status, 404);
    assert.equal((await request('/empty/')).status, 404);
  });

  it('M1: HEAD returns headers but no body', async () => {
    const r = await request('/hello.txt', { method: 'HEAD' });
    assert.equal(r.status, 200);
    assert.equal(r.headers['content-length'], String(Buffer.byteLength(TEXT)));
    assert.equal(r.body.length, 0);
  });

  it('M1: POST -> 405 with Allow header', async () => {
    const r = await request('/hello.txt', { method: 'POST' });
    assert.equal(r.status, 405);
    assert.match(r.headers.allow, /GET/);
    assert.match(r.headers.allow, /HEAD/);
  });
});

describe('M2: security', () => {
  // WHATWG URL parsing normalises these away before you see them, so 404 is acceptable.
  for (const p of ['/../secret.txt', '/%2e%2e/secret.txt', '/sub/../../secret.txt']) {
    it(`M2: never leaks files outside root: ${p}`, async () => {
      const r = await request(p);
      assert.ok([403, 404].includes(r.status), `got ${r.status}`);
      assert.ok(!r.body.toString().includes('TOP SECRET'));
    });
  }

  // An encoded slash survives URL parsing and only becomes ".." after decoding. YOU must catch it.
  for (const p of ['/..%2fsecret.txt', '/sub/..%2f..%2fsecret.txt', '/%2e%2e%2fsecret.txt']) {
    it(`M2: encoded traversal ${p} -> 403`, async () => {
      const r = await request(p);
      assert.equal(r.status, 403);
      assert.ok(!r.body.toString().includes('TOP SECRET'));
    });
  }

  it('M2: malformed percent-encoding -> 400', async () => {
    assert.equal((await request('/%E0%A4%A')).status, 400);
  });
});

describe('M3: caching', () => {
  it('M3: sends ETag and Last-Modified', async () => {
    const r = await request('/hello.txt');
    assert.ok(r.headers.etag, 'ETag missing');
    assert.ok(!Number.isNaN(Date.parse(r.headers['last-modified'])), 'Last-Modified invalid');
  });

  it('M3: If-None-Match with current ETag -> 304 and empty body', async () => {
    const { headers } = await request('/hello.txt');
    const r = await request('/hello.txt', { headers: { 'if-none-match': headers.etag } });
    assert.equal(r.status, 304);
    assert.equal(r.body.length, 0);
  });

  it('M3: stale ETag -> 200', async () => {
    const r = await request('/hello.txt', { headers: { 'if-none-match': '"stale"' } });
    assert.equal(r.status, 200);
  });
});

describe('M4: range requests', () => {
  it('M4: advertises Accept-Ranges', async () => {
    assert.equal((await request('/hello.txt')).headers['accept-ranges'], 'bytes');
  });

  it('M4: bytes=0-4', async () => {
    const r = await request('/hello.txt', { headers: { range: 'bytes=0-4' } });
    assert.equal(r.status, 206);
    assert.equal(r.headers['content-range'], `bytes 0-4/${TEXT.length}`);
    assert.equal(r.body.toString(), 'Hello');
  });

  it('M4: suffix range bytes=-5', async () => {
    const r = await request('/hello.txt', { headers: { range: 'bytes=-5' } });
    assert.equal(r.status, 206);
    assert.equal(r.body.toString(), TEXT.slice(-5));
  });

  it('M4: open-ended range bytes=1000-', async () => {
    const r = await request('/hello.txt', { headers: { range: 'bytes=1000-' } });
    assert.equal(r.status, 206);
    assert.equal(r.body.toString(), TEXT.slice(1000));
    assert.equal(r.headers['content-range'], `bytes 1000-${TEXT.length - 1}/${TEXT.length}`);
  });

  it('M4: unsatisfiable range -> 416', async () => {
    const r = await request('/hello.txt', { headers: { range: 'bytes=99999-' } });
    assert.equal(r.status, 416);
    assert.equal(r.headers['content-range'], `bytes */${TEXT.length}`);
  });
});

describe('M5: compression', () => {
  it('M5: gzips text when accepted', async () => {
    const r = await request('/hello.txt', { headers: { 'accept-encoding': 'gzip, deflate' } });
    assert.equal(r.status, 200);
    assert.equal(r.headers['content-encoding'], 'gzip');
    assert.match(r.headers.vary ?? '', /accept-encoding/i);
    assert.equal(gunzipSync(r.body).toString(), TEXT);
    assert.ok(r.body.length < TEXT.length, 'should actually compress');
  });

  it('M5: does not gzip binary types or when not accepted', async () => {
    const bin = await request('/blob.bin', { headers: { 'accept-encoding': 'gzip' } });
    assert.equal(bin.headers['content-encoding'], undefined);
    const plain = await request('/hello.txt');
    assert.equal(plain.headers['content-encoding'], undefined);
  });
});
