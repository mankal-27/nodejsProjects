# 04: Auth Service (passwords, JWTs, rate limiting, from scratch)

Build signup/login with properly hashed passwords, hand-rolled HS256 JWTs, Bearer auth, and
brute-force protection. You'll implement what `bcrypt`, `jsonwebtoken`, and
`express-rate-limit` do, and learn exactly where those libraries' security comes from.

> ⚠️ Learning project. In production use vetted libraries/IdPs, but *understand* them first.

## You'll learn
- `crypto.scrypt` with random salts: why a plain `sha256(password)` is broken
- `crypto.timingSafeEqual`: what a timing attack is and when it matters
- HMAC-SHA256 and the JWT format (`header.payload.signature`, base64url)
- Token expiry (`iat`/`exp`), the `alg: none` attack, and why you pin the algorithm
- Bearer auth via the `Authorization` header
- Fixed-window rate limiting keyed by email; `429` + `Retry-After`
- **Dependency injection for time** (`now()`) so time-based logic is testable
- Not leaking info: same error for "no such user" and "wrong password"

## Read first
- https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback
- https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b
- https://datatracker.ietf.org/doc/html/rfc7519 (skim sections 3 and 7)
- https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

## Spec

### `src/crypto.js`
| Function | Behaviour |
|---|---|
| `hashPassword(pw)` → `Promise<string>` | scrypt with a random 16-byte salt. Self-describing string, e.g. `scrypt$<salt b64>$<hash b64>`. Same password twice → different hashes. |
| `verifyPassword(pw, stored)` → `Promise<boolean>` | Recompute and compare with `timingSafeEqual`. Malformed `stored` → `false` (never throw). |
| `signToken(payload, secret, { expiresInSec = 3600, now = Date.now() })` → `string` | JWT, header `{"alg":"HS256","typ":"JWT"}`, adds `iat` and `exp` (in **seconds**) |
| `verifyToken(token, secret, { now = Date.now() })` → payload | Throws error with `code: 'E_TOKEN_INVALID'` (bad format, bad signature, alg ≠ HS256) or `code: 'E_TOKEN_EXPIRED'` |

### `src/server.js`: `createAuthServer({ secret, dbPath = ':memory:', now = () => Date.now() })` → `http.Server`
Table must be named `users` with at least columns `id`, `email`, `password_hash`.

| Endpoint | Behaviour |
|---|---|
| `POST /signup {email, password}` | `201 {id, email}`. Email trimmed + lowercased, must match `/^[^@\s]+@[^@\s]+\.[^@\s]+$/`. Password ≥ 8 chars. → `400 VALIDATION`. Existing email → `409 CONFLICT`. |
| `POST /login {email, password}` | `200 {token}`. Wrong password **or** unknown email → `401 INVALID_CREDENTIALS` (identical body). |
| `GET /me` | `Authorization: Bearer <token>` → `200 {id, email}`. Missing / malformed / bad / expired → `401 UNAUTHORIZED`. |
| rate limit | After **5 failed** logins for an email within a **15-minute** window, further logins for that email → `429 RATE_LIMITED` with `Retry-After` (seconds, integer > 0), even with the right password. Window resets after 15 minutes. |

Error format is the same as project 03: `{ "error": { "code", "message" } }`. Never return `password_hash`.

## Milestones
- **M1**: `hashPassword` / `verifyPassword`.
- **M2**: `signToken` / `verifyToken`.
- **M3**: `/signup`, `/login`, `/me`.
- **M4**: rate limiting.

## Stretch goals
- Refresh tokens (random opaque, stored hashed, rotation on use, reuse detection)
- `POST /logout` with a token denylist (`jti` claim)
- Password reset flow: single-use token, 15-min expiry, stored as SHA-256
- Store rate-limit state in SQLite so it survives restarts and works across processes
- Session cookies instead of JWTs: `HttpOnly; Secure; SameSite=Lax`. Write up the trade-offs.

<details><summary>Hints</summary>

- `import { scrypt as _s } from 'node:crypto'; const scrypt = util.promisify(_s);`
- base64url: `Buffer.from(json).toString('base64url')`
- `timingSafeEqual` throws if lengths differ. Check length first.
- Rate limiter: `Map<email, { count, windowStart }>`.
- Reuse your `readJson` / `sendJson` from project 03.
</details>
