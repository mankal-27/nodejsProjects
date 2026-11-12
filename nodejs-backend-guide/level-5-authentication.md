# Level 5: Authentication (Users, Passwords, Login, JWT)

**Goal:** Let users sign up and log in, store passwords safely, and protect routes so only logged-in users can change data.
**Time:** 1–2 weeks

---

## 📖 Study (in this order)

- [ ] Authentication vs authorization (short): https://auth0.com/docs/get-started/identity-fundamentals/authentication-and-authorization
- [ ] Why we hash passwords (and never store them as plain text): https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html (read the intro + "Hashing vs Encryption")
- [ ] ⭐ **Full Stack Open, Part 4c: User administration** (users + bcrypt): https://fullstackopen.com/en/part4/user_administration
- [ ] ⭐ **Full Stack Open, Part 4d: Token authentication** (JWT login + protected routes): https://fullstackopen.com/en/part4/token_authentication
- [ ] What is a JWT: https://jwt.io/introduction. Then paste a token into https://jwt.io to see inside it.
- [ ] `bcrypt` package: https://www.npmjs.com/package/bcrypt
- [ ] `jsonwebtoken` package: https://www.npmjs.com/package/jsonwebtoken
- [ ] (Optional) Sessions + cookies instead of JWT, Odin Project "Authentication Basics" lesson:
  https://www.theodinproject.com/paths/full-stack-javascript/courses/nodejs

**Video option:** search YouTube for *"JWT Authentication Tutorial Node.js Web Dev Simplified"*.

---

## ✅ Check yourself

1. Authentication vs authorization: what's the difference?
2. Why is hashing better than encrypting passwords? What is a "salt"?
3. What are the 3 parts of a JWT? Can anyone read the payload? (yes, so what should never go in it?)
4. Where does the client send the token? (`Authorization: Bearer <token>`)
5. What's the difference between status codes 401 and 403?

---

## 🛠️ Build: Add Users + Login to the Books API 🔐

| Method | URL | Who can use it | What it does |
|---|---|---|---|
| POST | `/api/auth/signup` | anyone | create an account `{ email, password }` |
| POST | `/api/auth/login` | anyone | returns `{ token }` |
| GET | `/api/auth/me` | logged in | returns your `{ id, email }` |
| GET | `/api/books` | anyone | list books (unchanged) |
| POST | `/api/books` | **logged in** | create a book (saved with `created_by` = your user id) |
| PUT/DELETE | `/api/books/:id` | **only the user who created it** | update/delete (others get **403**) |

### Database change
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE books ADD COLUMN created_by INTEGER REFERENCES users(id);
```

### Steps
- [ ] **Step 1:** Create the `users` table. `npm install bcrypt jsonwebtoken`.
- [ ] **Step 2:** `POST /api/auth/signup`: hash the password with `bcrypt.hash(password, 10)` and save it. Return `201 { id, email }`. **Never return the hash.**
- [ ] **Step 3:** Validate: the email must contain `@` and the password must be ≥ 8 chars → else 400. Duplicate email → **409**.
- [ ] **Step 4:** `POST /api/auth/login`: find the user, `bcrypt.compare()`, and on success sign a JWT `{ userId }` that expires in 1h.
- [ ] **Step 5:** Wrong email **or** wrong password → the same `401 { "error": "Invalid email or password" }` (don't reveal which).
- [ ] **Step 6:** Write middleware `requireAuth`: read the `Authorization` header, verify the token, set `req.user`, else 401.
- [ ] **Step 7:** `GET /api/auth/me` using `requireAuth`.
- [ ] **Step 8:** Protect `POST /api/books`; save `created_by = req.user.userId`.
- [ ] **Step 9:** `PUT`/`DELETE`: if `book.created_by !== req.user.userId` → **403 Forbidden**.
- [ ] **Step 10:** Put the JWT secret in an environment variable (`process.env.JWT_SECRET`) rather than in the code.
- [ ] **Step 11:** Test the full flow in Postman: signup → login → copy token → create book → try deleting as another user (403).

### ⭐ Stretch
- Login rate limit: max 5 attempts per minute (try the `express-rate-limit` package: https://www.npmjs.com/package/express-rate-limit)
- Roles: an `admin` can delete any book
- Refresh tokens or cookie-based sessions

### ✔️ Done when
Passwords in the DB look like `$2b$10$...`, you can't create books without a token, and you can't delete someone else's book.

---

## 🆘 Common stuck points
| Problem | Hint |
|---|---|
| `bcrypt.compare` always false | You're comparing against the wrong column, or you hashed twice |
| `JsonWebTokenError: jwt malformed` | You're sending `Bearer Bearer ...` or the token has quotes. Strip `"Bearer "` exactly once |
| `secretOrPrivateKey must have a value` | `JWT_SECRET` isn't set. Run `JWT_SECRET=abc123 node app.js` |
| `bcrypt` install fails | Use `bcryptjs` instead (pure JS, same API): https://www.npmjs.com/package/bcryptjs |

Stuck? Ask me: *"Level 5, Step 6: my requireAuth middleware always returns 401. Code: ..."*
