# 10 Projects to Build: What, Why, Use Case, How

Build them **in order**. Each one adds a few new skills on top of the last.
Projects 1–4 use **only Node built-ins** (to learn fundamentals). From Project 5 on, using
frameworks and libraries (Express/Fastify, PostgreSQL, Redis) is fine, because that's what jobs use.

Each project lists: **What** you build, **Why** it teaches you something, **Use case** (where
this exists in the real world), **Modules/tools**, **How** (step-by-step), **Stretch** goals,
and **References**.

---

## Project 1: CLI Notes / Todo App
- **What:** A command-line app: `notes add "buy milk" --tag home`, `notes list`, `notes rm <id>`. Saves to a JSON file.
- **Why:** Teaches async/await, the file system, modules, error handling, and CLI args, without HTTP getting in the way.
- **Use case:** Internal dev tools, scripts, migration/seed CLIs every company has.
- **Modules:** `fs/promises`, `path`, `os`, `util.parseArgs`, `crypto.randomUUID`, `process`, `node:test`
- **How:**
  1. Parse commands with `parseArgs` (positional command + flags).
  2. Write `loadNotes()` / `saveNotes()` with `fs/promises`. Treat a missing file as an empty list.
  3. Implement add / list / remove / search.
  4. Make saves **atomic**: write to `notes.json.tmp`, then `rename()`.
  5. Correct exit codes: `0` success, `1` error, `2` bad usage; errors go to `stderr`.
  6. Write tests with `node:test`.
- **Stretch:** Package as a single executable (SEA); add colors with `util.styleText`.
- **References:** https://nodejs.org/api/fs.html, https://nodejs.org/api/util.html#utilparseargsconfig

---

## Project 2: Static File Server
- **What:** A server like `npx serve`: `node server.js ./public` serves HTML/CSS/JS/images.
- **Why:** Teaches raw HTTP, **streams**, MIME types, caching headers, and a real security bug (path traversal).
- **Use case:** Nginx, CDNs, `express.static`. Every website is served by something like this.
- **Modules:** `http`, `fs` (streams), `path`, `url`, `stream/promises`, `zlib`
- **How:**
  1. `http.createServer` → map the URL path to a file under `root`.
  2. Block `../` escapes (resolve the path, check it starts with `root`). Return `403`.
  3. Stream files with `createReadStream` + `pipeline` (never `readFile` for big files).
  4. Set `Content-Type` by extension; `404` for missing files; `405` for non-GET.
  5. Add `ETag` + `If-None-Match` → `304 Not Modified`.
  6. Add `Range` support → `206 Partial Content` (this is how video seeking works).
  7. gzip text files when the client sends `Accept-Encoding: gzip`.
- **Stretch:** Directory listing page; graceful shutdown on `SIGTERM`.
- **References:** https://nodejs.org/api/stream.html, https://developer.mozilla.org/en-US/docs/Web/HTTP/Range_requests

---

## Project 3: REST API (raw Node + SQLite)
- **What:** A Bookmarks/Books/Tasks CRUD API: `POST /books`, `GET /books?limit=10`, `GET/PATCH/DELETE /books/:id`.
- **Why:** The core of backend work: routing, JSON bodies, validation, status codes, SQL, pagination, error format.
- **Use case:** Every app's backend (Trello, Notion, Shopify admin) is many of these.
- **Modules:** `http`, `URLPattern`, `node:sqlite`, `crypto`, `node:test`
- **How:**
  1. Build a tiny router: a list of `{ method, pattern, handler }` using `URLPattern`.
  2. Read the JSON body from the request stream with a **size limit** (413 if too big).
  3. Validate input → `400` with a consistent `{ error: { code, message } }` shape.
  4. Store in SQLite with **prepared statements** (prevents SQL injection).
  5. Use proper status codes: `201` + `Location`, `204` on delete, `404`, `409` duplicate.
  6. Add **cursor pagination** (`?limit=20&cursor=...`).
  7. Integration tests: start the server on port 0 and test with `fetch`.
- **Stretch:** Request logging with request IDs (`AsyncLocalStorage`); OpenAPI doc; full-text search.
- **References:** https://nodejs.org/api/sqlite.html, https://github.com/microsoft/api-guidelines

---

## Project 4: Authentication Service
- **What:** `POST /signup`, `POST /login`, `GET /me`, `POST /logout`, with hashed passwords, sessions or JWT, and login rate limiting.
- **Why:** Every app needs auth, and it's where security mistakes hurt most. Building it once shows you what libraries like Passport/Auth0 do.
- **Use case:** User accounts for any SaaS product.
- **Modules:** `crypto` (`scrypt`, `randomBytes`, `createHmac`, `timingSafeEqual`), `node:sqlite`, `http`
- **How:**
  1. Hash passwords with `scrypt` + random salt. **Never** store plain passwords.
  2. Login: same error for "no user" and "wrong password" (don't leak which emails exist).
  3. Option A, **sessions**: random token → store in DB → send as an `HttpOnly` cookie.
  4. Option B, **JWT**: sign `header.payload` with HMAC-SHA256; verify signature and expiry.
  5. Protect `/me`: read the cookie/`Authorization: Bearer` header → 401 if invalid.
  6. Rate limit: max 5 failed logins per email per 15 min → `429`.
- **Stretch:** Refresh tokens; password reset by email token; "Login with Google" (OAuth).
- **References:** https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html, https://jwt.io/introduction

---

## Project 5: Realtime Chat App
- **What:** Chat rooms: users join a room, send messages, and see who's online. Messages are saved.
- **Why:** Teaches long-lived connections, broadcasting, connection state, and heartbeats. Very different from request/response.
- **Use case:** Slack, WhatsApp Web, live notifications, multiplayer games, live dashboards.
- **Tools:** `ws` library (or build the protocol yourself on `http` `upgrade` for a challenge), SQLite/Postgres, simple HTML client
- **How:**
  1. WebSocket server at `/ws?room=general&user=ada`.
  2. Keep `Map<room, Set<connection>>`; broadcast messages to everyone in the room.
  3. Send `join` / `leave` events; a `GET /rooms` endpoint lists who's online.
  4. Save messages in the DB; send the last 50 when someone joins.
  5. Heartbeat: ping every 30s and drop clients that don't respond.
  6. Reuse Project 4 auth to identify users.
- **Stretch:** Typing indicators; scale to 2 server instances using Redis pub/sub.
- **References:** https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API, https://github.com/websockets/ws

---

## Project 6: URL Shortener with Caching & Analytics
- **What:** `POST /shorten` → `abc123`; visiting `/abc123` redirects; `GET /stats/abc123` shows click counts by day/country.
- **Why:** Teaches caching (Redis), redirects, high read traffic, rate limiting, and a classic **system design interview** question.
- **Use case:** bit.ly, tinyurl, marketing link trackers.
- **Tools:** Fastify or Express, PostgreSQL, Redis, Docker Compose
- **How:**
  1. Generate short codes (random base62; handle collisions).
  2. Store in Postgres with an index on `code`.
  3. On redirect, check Redis first → fall back to DB → cache it (**cache-aside pattern**).
  4. Record clicks asynchronously (don't slow down the redirect).
  5. Rate limit `POST /shorten` per IP using Redis counters.
  6. Run everything with `docker compose up`.
  7. Load test with `autocannon`; compare with and without the cache.
- **Stretch:** Custom aliases; expiring links; QR code generation.
- **References:** https://redis.io/docs/latest/, https://github.com/donnemartin/system-design-primer

---

## Project 7: Job Queue & Webhook Delivery System
- **What:** A service that receives events, queues them, and delivers them to customer URLs (webhooks), retrying failures with exponential backoff and a dead-letter queue.
- **Why:** Teaches background processing, reliability, retries, **idempotency**, and HMAC signatures. These are senior-level backend concepts.
- **Use case:** Stripe/GitHub/Shopify webhooks; sending emails; processing payments asynchronously.
- **Tools:** Postgres or SQLite (as the queue), or BullMQ + Redis; `crypto.createHmac`; `fetch`
- **How:**
  1. `POST /events` → store the job with status `pending` → respond `202 Accepted` immediately.
  2. A worker loop claims pending jobs (lock them so two workers can't take the same one).
  3. Deliver with `fetch` + timeout; sign the body with HMAC so receivers can verify it.
  4. On failure: retry at 1s, 2s, 4s, 8s... with random **jitter**; after N tries → `dead`.
  5. `Idempotency-Key` header: the same key twice creates only one job.
  6. Admin endpoints: list dead jobs, retry a dead job.
  7. Graceful shutdown: finish the current job on `SIGTERM`.
- **Stretch:** Per-customer rate limits; a dashboard with live stats via SSE.
- **References:** https://stripe.com/blog/idempotency, https://docs.bullmq.io, https://docs.stripe.com/webhooks

---

## Project 8: Log Aggregator & Search API
- **What:** An agent that tails log files in real time, parses JSON log lines, stores them in a DB, and serves `GET /logs?level=error&from=...&q=timeout`.
- **Why:** Teaches file watching, streams/readline, handling log rotation, batching DB inserts, and observability.
- **Use case:** Datadog, Loki, ELK stack, `kubectl logs`.
- **Modules:** `fs.watch`, `fs.open` + read from a byte offset, `readline`, `node:sqlite` (WAL mode), `worker_threads`, `http`
- **How:**
  1. Track the byte offset you've read; on change, read only the new bytes.
  2. Buffer partial lines (a write may end mid-line).
  3. Detect rotation (file shrank or inode changed) → restart from 0.
  4. Save a checkpoint `{ inode, offset }` so restarts don't re-read lines.
  5. Batch inserts (e.g. 500 rows per transaction) for speed.
  6. Query endpoint with level, time range, and text filters.
- **Stretch:** Move parsing to a worker pool; a live tail endpoint with SSE.
- **References:** https://nodejs.org/api/fs.html#fswatchfilename-options-listener, https://nodejs.org/api/readline.html

---

## Project 9: File/Image Processing Service
- **What:** Upload an image or CSV → get back thumbnails / a cleaned file. CPU work runs in workers; big files are streamed.
- **Why:** Teaches multipart uploads, streaming, **not blocking the event loop**, worker pools, and `child_process`.
- **Use case:** Cloudinary, profile-picture resizing, CSV imports in admin panels, video transcoding.
- **Modules/tools:** `stream`, `worker_threads`, `child_process` (e.g. `ffmpeg`/ImageMagick), `crypto` (checksums), `zlib`; `sharp` library for images is fine
- **How:**
  1. Accept uploads as a stream; enforce a max size; save to a temp file while hashing it (SHA-256).
  2. Push a job to a queue (reuse Project 7 ideas) → return `202` with a job ID.
  3. A worker pool (size = CPU cores) does the heavy processing.
  4. `GET /jobs/:id` returns status; `GET /files/:id` streams the result.
  5. For CSVs: stream through a `Transform` that validates each row; keep memory flat for 1 GB files.
  6. Measure: show the API stays responsive (low event-loop delay) during processing.
- **Stretch:** Resumable uploads; upload directly to S3-compatible storage (MinIO in Docker).
- **References:** https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop, https://nodejs.org/api/worker_threads.html

---

## Project 10: Capstone, E-commerce Backend
- **What:** A production-style backend: users, products, cart, orders, payments (Stripe test mode), inventory, emails, admin roles.
- **Why:** Combines everything: auth, DB design, transactions, queues, caching, webhooks, testing, Docker, deployment. This is your **main portfolio piece**.
- **Use case:** Shopify, Amazon, any online store.
- **Tools:** Fastify or NestJS, PostgreSQL (+ Prisma/Drizzle), Redis, BullMQ, Stripe test mode, Docker, GitHub Actions
- **How:**
  1. **Design first:** ER diagram (users, products, carts, orders, order_items, payments) and API list.
  2. Auth with roles (`customer`, `admin`); admins manage products.
  3. Products: list with filters, search, pagination; cache popular lists in Redis.
  4. Checkout in a **DB transaction**: check stock → create order → reserve inventory.
  5. Payment via Stripe Checkout (test mode); confirm with a **verified webhook**.
  6. Background jobs: order confirmation email, low-stock alert.
  7. Structured logging (Pino), request IDs, `/health` endpoint.
  8. Tests: unit + integration (real DB in Docker).
  9. Dockerfile + `docker compose`; CI runs tests on every push; deploy to Render/Railway/Fly.io.
  10. README: architecture diagram, setup steps, API docs (OpenAPI/Swagger), trade-offs.
- **Stretch:** Split notifications into a separate service; add OpenTelemetry tracing.
- **References:** https://docs.stripe.com/payments/checkout, https://12factor.net, https://docs.docker.com/guides/nodejs/

---

## Skills covered by each project

| Skill | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Async / event loop | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| File system | ✅ | ✅ | | | | | | ✅ | ✅ | |
| Streams | | ✅ | ✅ | | | | | ✅ | ✅ | |
| HTTP / REST | | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| SQL database | | | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | | ✅ |
| Auth & security | | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | | | ✅ |
| Caching / Redis | | ✅ | | | ✅ | ✅ | | | | ✅ |
| Realtime | | | | | ✅ | | | | | |
| Queues / retries | | | | | | | ✅ | | ✅ | ✅ |
| Concurrency (workers) | | | | | | | | ✅ | ✅ | |
| Testing | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Docker / deploy | | | | | | ✅ | | | ✅ | ✅ |

## For every project, finish with
1. A README: what it does, how to run it, an architecture diagram, and **trade-offs/limitations**.
2. Tests (`npm test`).
3. One benchmark or measurement (req/sec, memory, response time).
4. A short "What I learned" section. Interviewers love asking about this.
