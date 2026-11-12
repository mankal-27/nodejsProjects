# 03: Bookmarks REST API (raw `http` + `node:sqlite`)

A complete JSON REST API with no framework: your own router, body parser, validation, error
format, and persistence. After this, Express and Fastify will stop feeling like magic.

```bash
node src/main.js            # listens on :3000, db at ./bookmarks.db
curl -X POST localhost:3000/bookmarks -H 'content-type: application/json' \
  -d '{"url":"https://nodejs.org","title":"Node","tags":["js"]}'
curl 'localhost:3000/bookmarks?limit=10&tag=js'
```

## You'll learn
- Routing with the global **`URLPattern`** (`new URLPattern({ pathname: '/bookmarks/:id' })`)
- Reading a request body as a stream, **enforcing a size limit**, and parsing JSON safely
- Input validation and consistent error responses
- `node:sqlite` `DatabaseSync`, prepared statements, parameter binding (SQL injection!), `UNIQUE` constraints
- **Cursor pagination** vs offset pagination (and why cursors win)
- REST semantics: `201` + `Location`, `204`, `404`, `405`, `409`, `413`, `415`
- Writing a tiny middleware/handler abstraction yourself

## Read first
- https://nodejs.org/api/sqlite.html
- https://developer.mozilla.org/en-US/docs/Web/API/URLPattern
- https://nodejs.org/api/http.html#class-httpincomingmessage

## Spec: `createApp({ dbPath = ':memory:' })` → `http.Server`

Bookmark shape: `{ id: number, url: string, title: string, tags: string[], createdAt: string }`

| Method & path | Success | Errors |
|---|---|---|
| `GET /health` | `200 {"status":"ok"}` | |
| `POST /bookmarks` | `201`, body = bookmark, header `Location: /bookmarks/<id>` | 400 / 409 / 413 / 415 |
| `GET /bookmarks?limit&cursor&tag` | `200 {"items":[...], "nextCursor": string\|null}` | 400 bad limit |
| `GET /bookmarks/:id` | `200` bookmark | 404 |
| `PATCH /bookmarks/:id` | `200` updated bookmark (partial: any of url/title/tags) | 400 / 404 / 409 |
| `DELETE /bookmarks/:id` | `204`, empty body | 404 |
| known path, wrong method | `405` with `Allow` header | |
| anything else | `404` | |

**Validation** (`POST` all required except tags; `PATCH` same rules for provided fields):
- `url`: string, parseable by `new URL()`, protocol `http:` or `https:`
- `title`: string, 1–200 chars after trim
- `tags`: optional array of non-empty strings, max 10

**Errors** always look like:
```json
{ "error": { "code": "VALIDATION", "message": "human readable", "details": [ "url must be http(s)" ] } }
```
Codes: `VALIDATION` (400), `BAD_JSON` (400), `NOT_FOUND` (404), `METHOD_NOT_ALLOWED` (405),
`CONFLICT` (409, duplicate url), `PAYLOAD_TOO_LARGE` (413, body > 1 MiB),
`UNSUPPORTED_MEDIA_TYPE` (415, Content-Type not `application/json`), `INTERNAL` (500, never leak stack traces).

**Pagination**: ordered by `id` ascending. `limit` default 20, must be 1–100, else 400 `VALIDATION`.
`nextCursor` is an opaque string (your choice of encoding) or `null` when there are no more results.
`tag` filters to bookmarks containing that tag.

## Milestones
- **M1**: router, `/health`, 404/405, `POST` + `GET /:id`.
- **M2**: body parsing edge cases (bad JSON, 415, 413) + validation.
- **M3**: list with cursor pagination and tag filter.
- **M4**: `PATCH`, `DELETE`, `409` conflicts, persistence across restarts.

## Stretch goals
- Request logging middleware with request ids (`randomUUID`) and timing (`performance.now()`)
- `ETag` on GET + `If-Match` on PATCH for optimistic concurrency (`412`)
- Full-text search with SQLite FTS5: `GET /bookmarks?q=node`
- An OpenAPI spec served at `/openapi.json`
- Graceful shutdown that closes the DB *after* in-flight requests finish

<details><summary>Hints</summary>

- Tags: store as a JSON text column, or use a `bookmark_tags` join table (better for filtering).
- Size limit: count bytes in `req.on('data')`; once you exceed the limit, respond 413 and stop reading. Think about what happens to the rest of the upload.
- SQLite unique violation: catch the error and check `err.code === 'ERR_SQLITE_ERROR'` and `/UNIQUE/.test(err.message)`.
- Cursor: `Buffer.from(String(lastId)).toString('base64url')`.
- Wrap every handler in try/catch → 500 `INTERNAL`.
</details>
