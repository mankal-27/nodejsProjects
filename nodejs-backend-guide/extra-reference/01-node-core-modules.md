# Node.js Core Modules: What, Why, Use Case, Reference

Each entry covers **what** the module is, **why** you should learn it, a **real use case**,
**where** to study it, and a **5-minute exercise**.

Learn them in this order. Tier 1 is essential, Tier 2 is important, Tier 3 is advanced.

---

## Tier 1: Must know (every backend developer uses these)

### 0. The runtime itself: event loop, async, modules
- **What:** Node runs your JS on one thread. I/O (files, network) is handed to libuv and finishes later via callbacks/promises.
- **Why:** Every performance bug and "why is this undefined" bug in Node traces back to the event loop. You can't write good async code without this mental model.
- **Use case:** Understanding why one CPU-heavy `for` loop freezes your entire API for all users.
- **Study:**
  - https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick
  - https://nodejs.org/en/learn/asynchronous-work/overview-of-blocking-vs-non-blocking
  - ESM vs CommonJS: https://nodejs.org/api/esm.html
  - libuv design: https://docs.libuv.org/en/v1.x/design.html
- **Exercise:** Predict the output order of `setTimeout`, `setImmediate`, `process.nextTick`, `Promise.resolve().then` all called together. Then run it.

### 1. `process` (global)
- **What:** Info about and control over the running process: `process.env`, `argv`, `exit`, `exitCode`, signals, `memoryUsage()`.
- **Why:** Config comes from env vars; graceful shutdown needs signals; debugging needs memory stats.
- **Use case:** Read `DATABASE_URL` from env; on `SIGTERM` (Kubernetes/Docker stop), finish requests and close the DB before exiting.
- **Study:** https://nodejs.org/api/process.html
- **Exercise:** A script that prints `process.memoryUsage().rss` every second and exits cleanly on Ctrl+C.

### 2. `node:events` (EventEmitter)
- **What:** The publish/subscribe pattern that streams, servers, and sockets are built on.
- **Why:** `server.on('request')`, `stream.on('data')`, and `socket.on('close')` are all EventEmitter. Understanding it explains half of Node's API.
- **Use case:** Emit `order.created` inside your app so email, analytics, and inventory modules react independently.
- **Study:** https://nodejs.org/api/events.html (read about the `'error'` event, `once()`, and `on()` async iterator)
- **Exercise:** Build a tiny `OrderService extends EventEmitter` and attach 3 listeners.

### 3. `node:fs` and `node:fs/promises`
- **What:** Read, write, watch, and stat files and directories.
- **Why:** Uploads, logs, config, caches, and exports all touch the file system.
- **Use case:** Save uploaded files, rotate logs, generate CSV reports.
- **Study:** https://nodejs.org/api/fs.html. Learn `readFile` vs `createReadStream`, `rename` for atomic writes, and `watch`.
- **Exercise:** Copy a 1 GB file with `readFile`/`writeFile`, then with streams. Compare memory usage.

### 4. `node:path` and `node:url`
- **What:** Safe path joining/resolving; URL parsing (`URL`, `URLSearchParams`, `fileURLToPath`).
- **Why:** Hand-concatenated paths cause bugs and **path traversal security holes**.
- **Use case:** Serving `/uploads/:name` without letting someone request `../../etc/passwd`.
- **Study:** https://nodejs.org/api/path.html, https://nodejs.org/api/url.html
- **Exercise:** Write `safeJoin(root, userPath)` that throws if the result escapes `root`.

### 5. `Buffer`
- **What:** Raw binary data (bytes), Node's type for anything that isn't text.
- **Why:** Network packets, files, images, hashes, and encodings (base64, hex, utf-8) are all Buffers.
- **Use case:** Decoding a base64 image upload; computing a file checksum; parsing a binary protocol.
- **Study:** https://nodejs.org/api/buffer.html
- **Exercise:** Convert `"hello"` → Buffer → hex → base64 → back to string.

### 6. `node:stream` and `node:stream/promises`
- **What:** Process data piece by piece (Readable, Writable, Transform, Duplex) instead of loading it all into memory.
- **Why:** This is Node's superpower. It lets you handle 10 GB files or millions of rows with 50 MB of RAM. **Backpressure** is a classic interview topic.
- **Use case:** Stream a DB export to a CSV download; upload a file directly to S3 without buffering; gzip responses.
- **Study:**
  - https://nodejs.org/api/stream.html
  - https://nodejs.org/en/learn/modules/backpressuring-in-streams
  - Always use `pipeline()` instead of `.pipe()`. Learn why.
- **Exercise:** `pipeline(fs.createReadStream('big.log'), uppercaseTransform, fs.createWriteStream('out.log'))`.

### 7. `node:http` / `node:https`
- **What:** The HTTP server and client every framework (Express, Fastify, Nest) is built on.
- **Why:** Knowing what `req`/`res` really are means frameworks stop being magic. You'll debug them faster.
- **Use case:** Any web API. Also health-check endpoints, webhooks, proxies.
- **Study:** https://nodejs.org/api/http.html, plus MDN HTTP overview: https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview
- **Exercise:** A server with 3 routes, JSON responses, and proper 404/405 status codes, with no framework.

### 8. `fetch()` (global)
- **What:** Built-in HTTP client (same API as browsers).
- **Why:** Backends constantly call other APIs: payments, email, third-party services.
- **Use case:** Call the Stripe/GitHub/weather API with timeouts via `AbortSignal.timeout(5000)`.
- **Study:** https://nodejs.org/api/globals.html#fetch and MDN fetch: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
- **Exercise:** Fetch a JSON API with a 2-second timeout and retry up to 3 times.

### 9. `node:crypto`
- **What:** Hashing, HMAC, encryption, random values, password hashing (`scrypt`).
- **Why:** Security. Passwords, tokens, webhook signatures, and IDs all need it, and doing it wrong is dangerous.
- **Use case:** Hash passwords with `scrypt`; verify Stripe/GitHub webhook signatures with `createHmac` + `timingSafeEqual`; generate IDs with `randomUUID()`.
- **Study:** https://nodejs.org/api/crypto.html + https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- **Exercise:** `hashPassword()` / `verifyPassword()` using `scrypt` with a random salt.

### 10. `node:util`
- **What:** Helpers: `promisify`, `parseArgs` (CLI flags), `inspect`, `types`, `styleText`.
- **Why:** Convert old callback APIs to promises; build CLIs without libraries.
- **Use case:** A `migrate --up --env=prod` CLI for your project.
- **Study:** https://nodejs.org/api/util.html
- **Exercise:** A CLI that parses `--name`, `--verbose`, and positional args with `parseArgs`.

### 11. `node:test` and `node:assert`
- **What:** A built-in test runner (describe/it, mocks, fake timers, coverage) and assertions.
- **Why:** Professional backend code is tested. No Jest needed.
- **Use case:** Unit-test business logic; integration-test API endpoints by starting the server on port 0.
- **Study:** https://nodejs.org/api/test.html, https://nodejs.org/api/assert.html
- **Exercise:** Test a function, then mock `Date.now` with `mock.timers`.

---

## Tier 2: Important (you'll need these in real jobs)

### 12. `node:sqlite`
- **What:** Built-in SQLite database (`DatabaseSync`).
- **Why:** Learn SQL with zero setup. Great for prototypes, CLIs, local caches, and tests.
- **Use case:** A small app's database; local job queue; embedded analytics.
- **Study:** https://nodejs.org/api/sqlite.html + SQL practice at https://sqlbolt.com
- **Exercise:** Create a `users` table, insert with prepared statements, and query with `WHERE`.

### 13. `node:child_process`
- **What:** Run other programs (`spawn`, `exec`, `execFile`, `fork`).
- **Why:** Backends call `ffmpeg`, `git`, `imagemagick`, Python scripts, etc.
- **Use case:** Convert uploaded videos with `ffmpeg`; generate PDFs with a CLI tool.
- **Study:** https://nodejs.org/api/child_process.html. Learn why `exec` with user input is a **command-injection** risk.
- **Exercise:** `spawn('ls', ['-la'])` and stream its stdout.

### 14. `node:worker_threads`
- **What:** Real threads for CPU-heavy JavaScript.
- **Why:** CPU work (image resizing, hashing, parsing) blocks the event loop. Workers keep the API responsive.
- **Use case:** Generate thumbnails or big reports without freezing other requests.
- **Study:** https://nodejs.org/api/worker_threads.html + https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop
- **Exercise:** Compute fibonacci(40) in a worker while the main thread still answers HTTP.

### 15. `node:cluster`
- **What:** Run multiple Node processes sharing one port.
- **Why:** Use all CPU cores. (In production, PM2/Kubernetes often do this instead. Know both.)
- **Use case:** Scale an API on an 8-core server.
- **Study:** https://nodejs.org/api/cluster.html
- **Exercise:** Fork one worker per CPU; log which PID handled each request.

### 16. `node:zlib`
- **What:** gzip/deflate/brotli compression.
- **Why:** Smaller responses = faster APIs and lower bandwidth bills.
- **Use case:** Compress JSON responses; read `.gz` log archives.
- **Study:** https://nodejs.org/api/zlib.html
- **Exercise:** Gzip a file via streams and compare sizes.

### 17. `node:timers` and `node:timers/promises`
- **What:** `setTimeout`, `setInterval`, and promise-based `await setTimeout(ms)`.
- **Why:** Retries with backoff, polling, scheduled cleanup, timeouts.
- **Use case:** Retry a failed payment-API call after 1s, 2s, 4s...
- **Study:** https://nodejs.org/api/timers.html
- **Exercise:** `retry(fn, { attempts: 5 })` with exponential backoff.

### 18. `node:os`
- **What:** CPU count, memory, hostname, temp dir.
- **Why:** Sizing worker pools; health/metrics endpoints.
- **Use case:** `/health` returns uptime, load, and free memory.
- **Study:** https://nodejs.org/api/os.html

### 19. `node:readline`
- **What:** Read input line by line (from a file or terminal).
- **Why:** Process huge log/CSV files line by line; interactive CLIs.
- **Use case:** Import a 5 GB CSV into a DB without loading it all.
- **Study:** https://nodejs.org/api/readline.html
- **Exercise:** Count lines containing "ERROR" in a large log file.

### 20. `AsyncLocalStorage` (`node:async_hooks`)
- **What:** Carry context (like a request ID) through async calls without passing it everywhere.
- **Why:** Request-scoped logging and tracing in real production apps.
- **Use case:** Every log line for one HTTP request includes the same `requestId`.
- **Study:** https://nodejs.org/api/async_context.html
- **Exercise:** A logger that automatically prefixes the current request ID.

### 21. `node:perf_hooks`
- **What:** High-resolution timing, event-loop delay monitoring.
- **Why:** You can't optimize what you don't measure.
- **Use case:** Log slow endpoints; alert when event-loop lag > 100 ms.
- **Study:** https://nodejs.org/api/perf_hooks.html (see `monitorEventLoopDelay`)

---

## Tier 3: Advanced (systems-level, great for standing out)

| Module | What | Use case | Docs |
|---|---|---|---|
| `node:net` | Raw TCP servers/clients | Build a Redis-like server, chat over TCP, custom protocols | https://nodejs.org/api/net.html |
| `node:dgram` | UDP sockets | Metrics (StatsD), service discovery, heartbeats | https://nodejs.org/api/dgram.html |
| `node:dns` | DNS lookups | Service discovery, validating email domains | https://nodejs.org/api/dns.html |
| `node:http2` | HTTP/2 server/client | Multiplexed connections, gRPC-style APIs | https://nodejs.org/api/http2.html |
| `node:diagnostics_channel` | Publish internal events for tracing | APM tools (Datadog, OpenTelemetry) hook in here | https://nodejs.org/api/diagnostics_channel.html |
| `node:vm` | Run code in separate contexts | Templating, formula evaluation (**not** a security sandbox) | https://nodejs.org/api/vm.html |
| Permission Model | `--permission`, `--allow-fs-read` | Restrict what a script can touch | https://nodejs.org/api/permissions.html |
| Single Executable Apps | Ship your app as one binary | Distribute a CLI tool without needing Node installed | https://nodejs.org/api/single-executable-applications.html |
| TypeScript type stripping | Run `.ts` files directly with `node` | TypeScript backends without a build step | https://nodejs.org/api/typescript.html |
| Web Streams | `ReadableStream` (browser-standard streams) | Interop with `fetch()` bodies | https://nodejs.org/api/webstreams.html |

---

## Quick cheat sheet: "I need to... → use..."

| I need to... | Use |
|---|---|
| Build a web API | `http` → then Express/Fastify |
| Read a huge file | `fs.createReadStream` + `readline` / `stream` |
| Call another API | `fetch` + `AbortSignal.timeout` |
| Hash a password | `crypto.scrypt` (or bcrypt/argon2 libs) |
| Verify a webhook | `crypto.createHmac` + `timingSafeEqual` |
| Do CPU-heavy work | `worker_threads` |
| Run an external tool | `child_process.spawn` |
| Use all CPU cores | `cluster` (or PM2 / containers) |
| Retry with delay | `timers/promises` |
| Track request IDs in logs | `AsyncLocalStorage` |
| Measure performance | `perf_hooks` |
| Write tests | `node:test` + `node:assert` |
