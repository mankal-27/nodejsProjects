# Node.js Backend Mastery: 11 Hands-On Projects

Zero dependencies. Every project uses only Node.js built-ins (`node:http`, `node:net`,
`node:stream`, `node:crypto`, `node:sqlite`, `node:test`, ...). No Express, no ORM, no Jest.
You build the things those libraries do, so you understand what's happening underneath.

> Target: Node.js **24+** (developed on v26). Check with `node -v`.

## How this works

Every project folder contains:

| File | Purpose |
|---|---|
| `README.md` | The spec: what to build, concepts, docs to read, milestones, hints, stretch goals |
| `src/` | Starter files with function signatures and `TODO`s. **This is where you write code.** |
| `test/` | A test suite that acts as the spec. It fails now; your job is to make it pass. |
| `package.json` | `"dependencies": {}`, kept that way on purpose |

```bash
cd 01-notes-cli
npm test                                   # run everything
node --test --test-name-pattern="M1"       # run only milestone 1
node --test --watch                        # re-run on save
```

Work **milestone by milestone** (M1 → M2 → ...). Each milestone's tests are prefixed `M1:`,
`M2:`, etc. Don't read the hints until you've been stuck for 20+ minutes.

**Rules for yourself**
1. Don't edit the tests to make them pass (adding *more* tests is encouraged).
2. Read the linked Node docs page for each API before using it.
3. When a milestone passes, commit it and write 3 lines in the project's `NOTES.md`:
   what you learned, what surprised you, and what you'd do differently.

## The roadmap

### Phase 1: Foundations (core runtime, I/O, HTTP)
| # | Project | You'll really learn | Time |
|---|---|---|---|
| 01 | [Notes CLI](01-notes-cli) | modules, async/await, `fs/promises`, atomic writes, `parseArgs`, exit codes, serializing concurrent writes | 2–4 days |
| 02 | [Static File Server](02-static-file-server) | raw `http`, streams & backpressure, MIME, ETag/304, Range/206, path-traversal security | 3–5 days |
| 03 | [REST API with SQLite](03-rest-api-sqlite) | routing with `URLPattern`, body parsing & limits, validation, `node:sqlite`, pagination, error design | 1 week |

### Phase 2: Real backend concerns (security, protocols, realtime)
| # | Project | You'll really learn | Time |
|---|---|---|---|
| 04 | [Auth Service](04-auth-service) | `scrypt`, HMAC, JWT internals, `timingSafeEqual`, rate limiting, Bearer auth | 1 week |
| 05 | [WebSocket Chat from Scratch](05-websocket-chat) | HTTP `upgrade`, binary framing, masking, ping/pong, rooms, broadcast | 1 week |
| 06 | [Redis-compatible KV Server](06-kv-server) | `net` TCP, parsing streamed `Buffer`s, pipelining, TTLs, protocol design | 1–2 weeks |

### Phase 3: Systems & reliability (what senior backend engineers do)
| # | Project | You'll really learn | Time |
|---|---|---|---|
| 07 | [Durable Job Queue + Webhooks](07-job-queue) | at-least-once delivery, leases, exponential backoff + jitter, dead letters, idempotency, signatures | 1–2 weeks |
| 08 | [Log Tailer & Query Engine](08-log-tailer) | byte-offset tailing, log rotation, checkpoints, `readline`, SQLite WAL, `worker_threads` | 1–2 weeks |
| 09 | [Reverse Proxy & Load Balancer](09-reverse-proxy) | stream piping, hop-by-hop headers, round-robin/least-conn, health checks, timeouts, abort propagation | 2 weeks |
| 10 | [Resumable Streaming ETL](10-streaming-etl) | `pipeline`, `Transform`, gzip, hashing in-flight, HTTP Range resume, constant memory | 1–2 weeks |

### Phase 4: Capstone
| # | Project | You'll really learn | Time |
|---|---|---|---|
| 11 | [Sandboxed Plugin Runner](11-plugin-runner) | `child_process`, IPC, Permission Model, heap limits, timeouts, native TypeScript, why `vm` is *not* a sandbox | 2 weeks |

**Short on time?** Do 01 → 02 → 03 → 04 → 07 → 09. That's the core of backend work.

## Progress checklist

- [ ] 01 Notes CLI
- [ ] 02 Static File Server
- [ ] 03 REST API with SQLite
- [ ] 04 Auth Service
- [ ] 05 WebSocket Chat
- [ ] 06 KV Server
- [ ] 07 Job Queue + Webhooks
- [ ] 08 Log Tailer
- [ ] 09 Reverse Proxy
- [ ] 10 Streaming ETL
- [ ] 11 Plugin Runner

## Concepts you should be able to explain after finishing

- Event loop phases; microtasks vs macrotasks; why `await` in a loop can be slow
- Streams: backpressure, `highWaterMark`, why `pipeline()` beats `.pipe()`
- `Buffer` vs string; why you must not `toString()` a chunk that might split a UTF-8 char
- HTTP semantics: idempotency, status codes, caching headers, keep-alive, hop-by-hop headers
- Password storage, HMAC vs hashing, timing attacks, token expiry
- At-least-once vs exactly-once delivery; idempotency keys; leases
- When to use `worker_threads` vs `child_process` vs nothing
- Graceful shutdown: `SIGTERM`, `server.close()`, draining in-flight work

## Turning these into a portfolio

Each project is designed to be its own repo. Before publishing one:
1. Add an architecture diagram to its README (a hand-drawn diagram is fine).
2. Add a "Trade-offs & known limitations" section. Interviewers read this.
3. Add a `bench/` script with numbers (req/s, MB/s, peak RSS) via `node:perf_hooks`.
4. Run coverage: `node --test --experimental-test-coverage`.
5. Keep `"dependencies": {}`.
