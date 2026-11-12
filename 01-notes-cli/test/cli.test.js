import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CLI = fileURLToPath(new URL('../src/cli.js', import.meta.url));
let dir, file;

function run(...args) {
  return new Promise((resolve) => {
    execFile(process.execPath, [CLI, ...args], { env: { ...process.env, NOTES_FILE: file } }, (err, stdout, stderr) => {
      resolve({ code: err ? err.code : 0, stdout, stderr });
    });
  });
}

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'notes-cli-'));
  file = join(dir, 'notes.json');
});
afterEach(() => rm(dir, { recursive: true, force: true }));

describe('M4: CLI', () => {
  it('M4: add prints only the id', async () => {
    const r = await run('add', 'hello', '--tag', 'x');
    assert.equal(r.code, 0, r.stderr);
    assert.match(r.stdout.trim(), /^[0-9a-f-]{36}$/);
  });

  it('M4: list shows notes; --json prints an array', async () => {
    await run('add', 'first', '--tag', 'work');
    await run('add', 'second');
    const text = await run('list');
    assert.equal(text.code, 0);
    assert.match(text.stdout, /first/);
    assert.match(text.stdout, /second/);
    const json = await run('list', '--json', '--tag', 'work');
    const arr = JSON.parse(json.stdout);
    assert.deepEqual(arr.map((n) => n.text), ['first']);
  });

  it('M4: --file overrides NOTES_FILE', async () => {
    const other = join(dir, 'other.json');
    await run('add', 'elsewhere', '--file', other);
    const r = await run('list', '--json');
    assert.deepEqual(JSON.parse(r.stdout), []);
    const r2 = await run('list', '--json', '--file', other);
    assert.equal(JSON.parse(r2.stdout).length, 1);
  });

  it('M4: rm unknown id exits 1 with message on stderr', async () => {
    const r = await run('rm', 'does-not-exist');
    assert.equal(r.code, 1);
    assert.equal(r.stdout, '');
    assert.ok(r.stderr.length > 0);
  });

  it('M4: unknown command exits 2 with usage on stderr', async () => {
    const r = await run('frobnicate');
    assert.equal(r.code, 2);
    assert.match(r.stderr, /Usage/);
  });

  it('M4: add without text exits 2', async () => {
    const r = await run('add');
    assert.equal(r.code, 2);
  });
});
