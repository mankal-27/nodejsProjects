# Backend Development Concepts: What, Why, Use Case, Reference

Node is the tool. **Backend development** is the craft: designing APIs, storing data safely,
securing users, and keeping systems fast and reliable. Learn these topics alongside Node.

---

## 1. HTTP fundamentals
- **What:** Methods (GET/POST/PUT/PATCH/DELETE), status codes, headers, cookies, CORS, keep-alive, HTTPS/TLS.
- **Why:** Every API bug eventually becomes "what exactly did the request/response contain?"
- **Use case:** Choosing `201` vs `200`, why the browser blocks your API (CORS), why the login cookie isn't sent.
- **Learn:**
  - MDN HTTP: https://developer.mozilla.org/en-US/docs/Web/HTTP
  - Status codes: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
  - CORS: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
  - *High Performance Browser Networking*: https://hpbn.co
- **Practice:** Use `curl -v` against any API and explain every header you see.

## 2. API design (REST, plus GraphQL/gRPC awareness)
- **What:** Resource naming, versioning, pagination, filtering, error formats, idempotency.
- **Why:** An API is a contract. Bad design is painful to change once clients depend on it.
- **Use case:** `GET /orders?status=paid&limit=20&cursor=abc` returning a consistent `{ data, nextCursor }`.
- **Learn:**
  - Microsoft REST API Guidelines: https://github.com/microsoft/api-guidelines
  - Google API Design Guide: https://cloud.google.com/apis/design
  - Stripe API docs (the gold standard to imitate): https://docs.stripe.com/api
  - OpenAPI spec: https://swagger.io/specification/
- **Practice:** Design (on paper) the endpoints for a library app before writing any code.

## 3. Frameworks (after learning raw `http`)
- **What:** Express (most common), Fastify (fast, schema-based), NestJS (structured, enterprise).
- **Why:** Jobs use them. Learn one well, *after* you know what they abstract.
- **Use case:** Routing, middleware, validation, plugins.
- **Learn:**
  - Express: https://expressjs.com
  - Fastify: https://fastify.dev/docs/latest/
  - NestJS: https://docs.nestjs.com
- **Practice:** Rebuild your raw-`http` API in Fastify and compare the code.

## 4. Databases: SQL first
- **What:** Tables, relations, joins, indexes, transactions, migrations. PostgreSQL is the industry default.
- **Why:** Data outlives code. Most performance problems are slow queries.
- **Use case:** Transfer money between accounts atomically (transaction); make a search 1000× faster (index).
- **Learn:**
  - SQLBolt (interactive): https://sqlbolt.com
  - Use The Index, Luke (indexes explained): https://use-the-index-luke.com
  - PostgreSQL tutorial: https://www.postgresql.org/docs/current/tutorial.html
  - Node driver: https://node-postgres.com
- **Then:** an ORM/query builder (Prisma, Drizzle, or Knex), *after* you can write the SQL yourself.
- **Practice:** Model users → orders → order_items; write a query for "top 5 customers by spend".

## 5. NoSQL & caching (Redis, MongoDB)
- **What:** Redis = in-memory key-value store (cache, sessions, rate limits, queues). MongoDB = document DB.
- **Why:** Caching is the #1 way to make a slow backend fast.
- **Use case:** Cache a product page for 60s; store sessions; count requests per IP for rate limiting.
- **Learn:**
  - Redis University (free): https://university.redis.io
  - Redis docs: https://redis.io/docs/latest/
  - MongoDB University: https://learn.mongodb.com
  - HTTP caching: https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching
- **Practice:** Add a Redis cache in front of a slow endpoint; measure before/after.

## 6. Authentication & authorization
- **What:** AuthN = *who are you* (passwords, sessions, JWT, OAuth/OpenID Connect). AuthZ = *what can you do* (roles, permissions).
- **Why:** Getting this wrong means data breaches.
- **Use case:** Login with email/password; "Login with Google"; admins can delete, users can only read.
- **Learn:**
  - OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
  - Session management: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
  - JWT intro: https://jwt.io/introduction
  - OAuth 2 simplified: https://aaronparecki.com/oauth-2-simplified/
- **Practice:** Build signup/login with hashed passwords + sessions, then add JWT, and write down the trade-offs.

## 7. Security
- **What:** Injection (SQL, command), XSS, CSRF, broken access control, secrets management, rate limiting, input validation.
- **Why:** One vulnerability can end a company.
- **Use case:** Parameterized queries stop SQL injection; validating `userId` ownership stops users reading others' data.
- **Learn:**
  - OWASP Top 10: https://owasp.org/www-project-top-ten/
  - OWASP API Security Top 10: https://owasp.org/API-Security/
  - Node.js security best practices: https://nodejs.org/en/learn/getting-started/security-best-practices
- **Practice:** Attack your own API: try SQL injection, oversized bodies, accessing another user's resource.

## 8. Validation & error handling
- **What:** Never trust input; return consistent errors; never leak stack traces.
- **Why:** Most crashes and security bugs come from unexpected input.
- **Use case:** Reject `{ "age": "abc" }` with a clear `400` instead of a `500`.
- **Learn:**
  - Zod (popular validator): https://zod.dev
  - Error handling in Node: https://github.com/goldbergyoni/nodebestpractices#2-error-handling-practices
  - Problem Details (RFC 9457): https://www.rfc-editor.org/rfc/rfc9457

## 9. Background jobs & message queues
- **What:** Work done outside the request (emails, reports, video processing), with retries and dead-letter queues.
- **Why:** Users shouldn't wait 30s for an email to send. Failures need automatic retries.
- **Use case:** Order placed → respond immediately → a queue job sends the receipt and updates inventory.
- **Learn:**
  - BullMQ (Redis-based queue for Node): https://docs.bullmq.io
  - RabbitMQ tutorials: https://www.rabbitmq.com/tutorials
  - Idempotency (Stripe blog): https://stripe.com/blog/idempotency
- **Practice:** Build a job that fails randomly; implement retries with exponential backoff.

## 10. Realtime communication
- **What:** WebSockets (two-way), Server-Sent Events (server → client), long polling.
- **Why:** Chat, notifications, live dashboards, multiplayer.
- **Use case:** "Your order is out for delivery" pushed instantly to the app.
- **Learn:**
  - WebSockets (MDN): https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
  - SSE (MDN): https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
  - `ws` library: https://github.com/websockets/ws, Socket.IO: https://socket.io/docs/v4/

## 11. Testing
- **What:** Unit tests (functions), integration tests (API + DB), end-to-end tests.
- **Why:** Lets you change code without fear. Required in professional teams.
- **Use case:** CI runs tests on every pull request; a bug fix comes with a test that proves it.
- **Learn:**
  - `node:test`: https://nodejs.org/api/test.html
  - JavaScript testing best practices: https://github.com/goldbergyoni/javascript-testing-best-practices
- **Practice:** Write integration tests that start your server on port 0 and call it with `fetch`.

## 12. Logging, monitoring & observability
- **What:** Structured logs (JSON), metrics (latency, error rate), tracing (following one request across services).
- **Why:** In production you can't use `console.log` + a debugger. Logs and metrics are your eyes.
- **Use case:** "API is slow". The trace shows a DB query taking 3s.
- **Learn:**
  - Pino logger: https://getpino.io
  - OpenTelemetry for Node: https://opentelemetry.io/docs/languages/js/
  - Google SRE book (free): https://sre.google/sre-book/table-of-contents/

## 13. Configuration & app structure
- **What:** Env-based config, layered architecture (routes → controllers → services → repositories), dependency injection.
- **Why:** Keeps code testable and maintainable as it grows.
- **Use case:** Same code runs in dev/staging/prod with only env vars changing.
- **Learn:**
  - Twelve-Factor App: https://12factor.net
  - Project structure: https://github.com/goldbergyoni/nodebestpractices#1-project-architecture-practices

## 14. Deployment & DevOps basics
- **What:** Docker, CI/CD (GitHub Actions), reverse proxies (Nginx), cloud basics (a VM, managed DB), env secrets.
- **Why:** Code isn't done until it's running somewhere.
- **Use case:** `git push` → tests run → Docker image built → deployed.
- **Learn:**
  - Docker get started: https://docs.docker.com/get-started/
  - Dockerizing Node: https://nodejs.org/en/learn/getting-started/nodejs-with-docker (or Docker's Node guide: https://docs.docker.com/guides/nodejs/)
  - GitHub Actions: https://docs.github.com/en/actions
  - Free hosting to practice: Render, Railway, Fly.io

## 15. Performance & scaling
- **What:** Profiling, caching, connection pooling, horizontal scaling, load balancing, CDNs, DB read replicas.
- **Why:** What works for 10 users breaks at 10,000.
- **Use case:** Handling a traffic spike on sale day.
- **Learn:**
  - Node.js profiling: https://nodejs.org/en/learn/getting-started/profiling
  - System Design Primer: https://github.com/donnemartin/system-design-primer
  - *Designing Data-Intensive Applications* (book)
- **Practice:** Load test with `autocannon` (https://github.com/mcollina/autocannon), find the bottleneck, fix it, and re-measure.

## 16. System design & architecture
- **What:** Monolith vs microservices, event-driven design, CAP theorem, consistency, rate limiting, sharding.
- **Why:** Senior roles and interviews require it.
- **Learn:**
  - System Design Primer: https://github.com/donnemartin/system-design-primer
  - ByteByteGo (newsletter/YouTube): https://bytebytego.com
  - Martin Fowler on microservices: https://martinfowler.com/articles/microservices.html
