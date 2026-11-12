# 01: Notes CLI

A command-line notes app that stores notes in a JSON file. It sounds simple, but getting it
*correct* (atomic writes, concurrent writes, corrupt files, proper exit codes) covers most
of Node's core runtime.

```bash
node src/cli.js add "Buy milk" --tag home --tag errands   # prints new id
node src/cli.js list --tag home
node src/cli.js list --json
node src/cli.js search milk
node src/cli.js rm <id>
```

## You'll learn
- ES modules, `import.meta`, top-level `await`
- `node:fs/promises`: `readFile`, `writeFile`, `rename`, `mkdir`
- **Atomic writes**: write to a temp file, then `rename()` (why does this prevent corruption?)
- **Serializing async writes**: why `Promise.all([add(), add()])` can lose data, and how a promise chain or mutex fixes it
- `node:util` `parseArgs`, `process.argv`, `process.exitCode`, stdout vs stderr
- `node:crypto` `randomUUID`
- Custom errors with `code` properties
- Testing with `node:test`, `node:assert/strict`, and spawning child processes

## Read first
- https://nodejs.org/api/fs.html#promises-api
- https://nodejs.org/api/util.html#utilparseargsconfig
- https://nodejs.org/api/test.html
- https://nodejs.org/api/process.html#processexitcode

## Spec

### `src/store.js`: `openStore(filePath)` → `Promise<Store>`
| Method | Behaviour |
|---|---|
| `add(text, { tags = [] } = {})` | Returns note `{ id, text, tags, createdAt }`. `id` = `randomUUID()`, `createdAt` = ISO string. Empty/whitespace `text` → throws `TypeError`. Trims text. |
| `list({ tag } = {})` | All notes, oldest first, optionally filtered by tag |
| `get(id)` | Note or `null` |
| `remove(id)` | `true` if removed, `false` if not found |
| `search(query)` | Case-insensitive substring match on `text` |

- File missing → behaves as empty store (don't create it until first write).
- File contains invalid JSON → `openStore` rejects with an error whose `code === 'E_CORRUPT'`.
- Every mutation persists **atomically** (temp file + rename, with no `.tmp` files left behind).
- Concurrent calls must not lose writes.

### `src/cli.js`
- Store path: `--file <path>` flag, else `NOTES_FILE` env var, else `~/.notes.json`.
- `add <text> [--tag t]...` prints **only the id** on stdout.
- `list [--tag t] [--json]`: one line per note: `<id>  <text>  [tag1, tag2]`; `--json` prints a JSON array.
- `search <query> [--json]`, same format as list.
- `rm <id>`: prints `removed <id>`; unknown id → message on **stderr**, exit code `1`.
- Unknown command or missing args → usage on **stderr**, exit code `2`.

## Milestones
- **M1**: `add`, `list`, persistence, missing file.
- **M2**: `get`, `remove`, `search`, tag filtering, validation.
- **M3**: corrupt-file detection, atomic writes, concurrent-write safety.
- **M4**: the CLI (exit codes, stdout/stderr, `--json`).

## Stretch goals
- `notes edit <id> <text>`
- `notes export --format md` that streams to stdout
- Ship it as a **Single Executable Application** (https://nodejs.org/api/single-executable-applications.html)
- Add a file lock (`open` with `wx` flag) so two *processes* can't clobber each other

<details><summary>Hints (open only if stuck)</summary>

- Concurrency: keep `let queue = Promise.resolve()` and do `queue = queue.then(() => doWrite())`. Return that promise.
- Atomic: `await writeFile(file + '.' + process.pid + '.tmp', data); await rename(tmp, file);`
- Missing file: catch `err.code === 'ENOENT'`.
- In the CLI, set `process.exitCode = 2` instead of calling `process.exit()` so stdout flushes.
</details>
