# Level 6: Make It Professional (Validation, Errors, Config, Testing)

**Goal:** Add the things that make code "job ready": input validation, one error handler, `.env` config, project structure, and automated tests.
**Time:** 1–2 weeks

---

## 📖 Study (in this order)

- [ ] Express error handling: https://expressjs.com/en/guide/error-handling.html
- [ ] Environment variables in Node (built-in `--env-file`, no package needed):
  https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs
- [ ] ⭐ **Full Stack Open, Part 4a: Structure of backend application + intro to testing**:
  https://fullstackopen.com/en/part4/structure_of_backend_application_introduction_to_testing
- [ ] ⭐ **Full Stack Open, Part 4b: Testing the backend** (API tests with supertest):
  https://fullstackopen.com/en/part4/testing_the_backend
- [ ] Node's built-in test runner: https://nodejs.org/en/learn/test-runner/using-test-runner
- [ ] `supertest` (test Express apps): https://www.npmjs.com/package/supertest
- [ ] Validation with **Zod**: https://zod.dev (read "Basic usage")
- [ ] Project structure best practices (skim section 1): https://github.com/goldbergyoni/nodebestpractices
- [ ] ESLint (finds bugs automatically): https://eslint.org/docs/latest/use/getting-started

---

## ✅ Check yourself

1. Why should you never put passwords or secrets directly in your code?
2. What does an Express error-handling middleware look like? (Hint: it has **4** arguments.)
3. Why validate on the server even if the frontend already validates?
4. What's the difference between a unit test and an integration (API) test?
5. Why should tests use a separate database?

---

## 🛠️ Build: Upgrade the Books API to "Professional" 🧪

### Target structure
```
books-api/
  src/
    app.js               ← builds the express app (exported for tests, no .listen here)
    server.js            ← imports app and calls app.listen()
    config.js            ← reads process.env in one place
    db.js
    routes/              ← books.routes.js, auth.routes.js
    controllers/         ← handle req/res
    services/            ← business logic + SQL
    middleware/          ← requireAuth.js, validate.js, errorHandler.js
  tests/
    books.test.js
    auth.test.js
  .env                   ← real secrets (in .gitignore!)
  .env.example           ← same keys, fake values (committed)
  .gitignore
```

### Steps
- [ ] **Step 1:** Create `.env` with `DATABASE_URL`, `JWT_SECRET`, and `PORT`. Run with `node --env-file=.env src/server.js`. Add `.env` to `.gitignore`. Create `.env.example`.
- [ ] **Step 2:** Split `app.js` and `server.js` (needed so tests can import the app without starting a server).
- [ ] **Step 3:** Move the code into routes → controllers → services. Routes only map URLs; services hold the logic.
- [ ] **Step 4:** Install `zod`. Write schemas for "create book", "signup", and "login". Make a `validate(schema)` middleware that returns 400 with a clear list of errors.
- [ ] **Step 5:** Create **one** error-handling middleware. Every error response should look like:
  `{ "error": { "message": "Book not found" } }`. Unexpected errors → 500 `"Something went wrong"` (log the real error, don't send it).
- [ ] **Step 6:** Create a custom `NotFoundError` / `ForbiddenError` class so services can `throw new NotFoundError('Book not found')`.
- [ ] **Step 7:** Install `supertest`. Use a separate test database (`books_test`).
- [ ] **Step 8:** Write tests (with `node:test` or Jest):
  - [ ] GET `/api/books` returns 200 and an array
  - [ ] POST without a token → 401
  - [ ] POST with invalid data → 400
  - [ ] signup → login → create book → 201
  - [ ] deleting someone else's book → 403
  - [ ] GET a missing book → 404
- [ ] **Step 9:** `npm test` script. All tests green ✅
- [ ] **Step 10:** Add ESLint and fix all warnings.
- [ ] **Step 11:** GitHub Actions: run tests on every push: https://docs.github.com/en/actions/use-cases-and-examples/building-and-testing/building-and-testing-nodejs

### ⭐ Stretch
- Request logging with **pino**: https://getpino.io
- `GET /health` endpoint that checks the DB connection
- Test coverage: `node --test --experimental-test-coverage`

### ✔️ Done when
No secrets in git, one error format everywhere, invalid input never causes a 500, and `npm test` passes locally and on GitHub.

---

## 🆘 Common stuck points
| Problem | Hint |
|---|---|
| Errors thrown in `async` routes aren't caught (Express 4) | Use Express 5 (`npm install express@5`), which catches async errors automatically |
| Tests interfere with each other | Clear the tables in `beforeEach` |
| Tests hang and never finish | Close the DB pool in `after()` / `afterAll()` |
| `process.env.X` is undefined | You forgot `--env-file=.env`, or there's a typo in the key |

Stuck? Ask me: *"Level 6, Step 8: my supertest test hangs. Code: ..."*
