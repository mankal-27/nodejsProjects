import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore } from '../src/store.js';

let dir, file;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'notes-'));
  file = join(dir, 'notes.json');
});
afterEach(() => rm(dir, { recursive: true, force: true }));

describe('M1: add, list, persistence', () => {
  it('M1: missing file behaves as an empty store', async () => {
    const store = await openStore(file);
    assert.deepEqual(await store.list(), []);
  });

  it('M1: add returns a well-formed note', async () => {
    const store = await openStore(file);
    const note = await store.add('  hello world  ', { tags: ['a'] });
    assert.equal(typeof note.id, 'string');
    assert.match(note.id, /^[0-9a-f-]{36}$/);
    assert.equal(note.text, 'hello world');
    assert.deepEqual(note.tags, ['a']);
    assert.ok(!Number.isNaN(Date.parse(note.createdAt)));
  });

  it('M1: notes persist across reopen, oldest first', async () => {
    const s1 = await openStore(file);
    await s1.add('one');
    await s1.add('two');
    const s2 = await openStore(file);
    assert.deepEqual((await s2.list()).map((n) => n.text), ['one', 'two']);
    const raw = JSON.parse(await readFile(file, 'utf8'));
    assert.ok(raw, 'file should contain valid JSON');
  });
});

describe('M2: get, remove, search, filter', () => {
  it('M2: get returns the note or null', async () => {
    const s = await openStore(file);
    const n = await s.add('x');
    assert.deepEqual(await s.get(n.id), n);
    assert.equal(await s.get('nope'), null);
  });

  it('M2: remove returns true/false and persists', async () => {
    const s = await openStore(file);
    const n = await s.add('x');
    assert.equal(await s.remove(n.id), true);
    assert.equal(await s.remove(n.id), false);
    assert.deepEqual(await (await openStore(file)).list(), []);
  });

  it('M2: list filters by tag', async () => {
    const s = await openStore(file);
    await s.add('a', { tags: ['work'] });
    await s.add('b', { tags: ['home'] });
    await s.add('c', { tags: ['work', 'urgent'] });
    assert.deepEqual((await s.list({ tag: 'work' })).map((n) => n.text), ['a', 'c']);
  });

  it('M2: search is case-insensitive', async () => {
    const s = await openStore(file);
    await s.add('Buy MILK');
    await s.add('walk dog');
    assert.deepEqual((await s.search('milk')).map((n) => n.text), ['Buy MILK']);
  });

  it('M2: empty text is rejected with TypeError', async () => {
    const s = await openStore(file);
    await assert.rejects(s.add('   '), TypeError);
  });
});

describe('M3: robustness', () => {
  it('M3: corrupt file rejects with code E_CORRUPT', async () => {
    await writeFile(file, '{not json');
    await assert.rejects(openStore(file), { code: 'E_CORRUPT' });
  });

  it('M3: no temp files are left behind', async () => {
    const s = await openStore(file);
    await s.add('a');
    await s.add('b');
    assert.deepEqual(await readdir(dir), ['notes.json']);
  });

  it('M3: concurrent adds do not lose writes', async () => {
    const s = await openStore(file);
    await Promise.all(Array.from({ length: 25 }, (_, i) => s.add(`note ${i}`)));
    const reopened = await openStore(file);
    assert.equal((await reopened.list()).length, 25);
  });
});
