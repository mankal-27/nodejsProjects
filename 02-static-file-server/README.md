# 02: Static File Server

A production-grade static file server built on raw `node:http`. This is what `serve`,
`nginx`, or `express.static` do. Getting the HTTP semantics right is the real lesson.

```bash
node src/main.js ./public 8080
curl -i localhost:8080/
curl -i -H 'Range: bytes=0-9' localhost:8080/big.txt
```

## You'll learn
- `http.createServer`, the `req`/`res` objects, `res.writeHead`, status codes
- **Streams**: `fs.createReadStream` + `pipeline()` instead of `readFile` (why? try a 2 GB file)
- **Backpressure**: what happens when the client is slower than the disk
- HTTP caching: `ETag`, `Last-Modified`, `If-None-Match` → `304 Not Modified`
- Partial content: `Range` → `206`, `Content-Range`, `416`
- **Security**: path traversal (`/../../etc/passwd`, `%2e%2e`), and why `path.join` alone isn't enough
- Content negotiation: `Accept-Encoding: gzip` with `node:zlib`

## Read first
- https://nodejs.org/api/http.html
- https://nodejs.org/api/stream.html#streampipelinesource-transforms-destination-callback
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Range_requests
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching

## Spec: `createStaticServer({ root })` → `http.Server` (not listening)

| Request | Response |
|---|---|
| `GET /file.txt` | `200`, body, `Content-Type`, `Content-Length`, `ETag`, `Last-Modified`, `Accept-Ranges: bytes` |
| `GET /` or `GET /dir/` | serve `index.html` in that dir if present, else `404` |
| `HEAD /file.txt` | same headers as GET, **no body** |
| missing file | `404` |
| path escapes `root` after decoding (`/..%2fx`, `/%2e%2e%2fx`) | `403` (plain `/../x` gets normalised by `new URL()` first, so `404` is fine there; just never leak the file) |
| malformed percent-encoding (`/%E0%A4%A`) | `400` |
| `POST`/`PUT`/... | `405` with `Allow: GET, HEAD` |
| `If-None-Match` matches ETag | `304`, no body |
| `Range: bytes=0-4` | `206`, `Content-Range: bytes 0-4/<size>`, exactly 5 bytes |
| `Range: bytes=-5` (suffix) | `206`, last 5 bytes |
| `Range: bytes=10-` (open-ended) | `206`, from byte 10 to end |
| unsatisfiable range (start ≥ size) | `416`, `Content-Range: bytes */<size>` |
| `Accept-Encoding: gzip` on text types (`.html .css .js .json .txt .svg`) | gzipped body, `Content-Encoding: gzip`, `Vary: Accept-Encoding`, no `Content-Length` |

MIME types (minimum): `.html text/html; charset=utf-8`, `.css text/css; charset=utf-8`,
`.js text/javascript; charset=utf-8`, `.json application/json`, `.txt text/plain; charset=utf-8`,
`.png image/png`, `.svg image/svg+xml`. Anything else gets `application/octet-stream`.

## Milestones
- **M1**: serve files, MIME types, 404, index.html, HEAD, 405.
- **M2**: security (traversal → 403, bad encoding → 400).
- **M3**: caching (ETag / 304).
- **M4**: Range requests.
- **M5**: gzip.

## Stretch goals
- Directory listing HTML page (escape filenames! XSS)
- `Cache-Control` config, plus `immutable` for hashed filenames
- Graceful shutdown on `SIGTERM` (`server.close()` + `closeIdleConnections()`)
- Benchmark with `autocannon` (via `npx`) and compare against `npx serve`
- Pre-compressed `.gz` / `.br` sidecar files

<details><summary>Hints</summary>

- `const url = new URL(req.url, 'http://x')`. Then `decodeURIComponent(url.pathname)` throws `URIError` on bad encoding.
- Traversal: `const full = path.resolve(root, '.' + decoded)`, then check `full === root || full.startsWith(root + path.sep)`.
- ETag: something like `W/"${stat.size.toString(16)}-${stat.mtimeMs.toString(16)}"`.
- `createReadStream(file, { start, end })` (`end` is inclusive!).
- Use `pipeline(stream, res, cb)` so a client disconnect closes the file descriptor.
</details>
