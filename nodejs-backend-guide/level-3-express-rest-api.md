# Level 3: Express + REST APIs

**Goal:** Build a proper REST API with Express: routes, JSON, route params, middleware, status codes.
**Time:** 1–2 weeks

---

## 📖 Study (in this order)

- [ ] What is a REST API (simple explanation): https://developer.mozilla.org/en-US/docs/Glossary/REST
  and https://restfulapi.net (read "What is REST" and "Resource Naming")
- [ ] ⭐ **Full Stack Open, Part 3a: Node.js and Express** (main lesson, follow along and type the code):
  https://fullstackopen.com/en/part3/node_js_and_express
- [ ] Express hello world: https://expressjs.com/en/starter/hello-world.html
- [ ] Express routing (route params like `/books/:id`): https://expressjs.com/en/guide/routing.html
- [ ] Middleware (the key Express concept): https://expressjs.com/en/guide/using-middleware.html
- [ ] Odin Project NodeJS course: the Express lessons ("Routes", "Controllers", "Middleware"):
  https://www.theodinproject.com/paths/full-stack-javascript/courses/nodejs
- [ ] Auto-restart on save: run `node --watch app.js` (built into Node)

**Video option:** search YouTube for *"Node.js and Express.js Full Course freeCodeCamp"* (John Smilga).

**Interactive option:** freeCodeCamp "Basic Node and Express":
https://www.freecodecamp.org/learn/back-end-development-and-apis/#basic-node-and-express

---

## ✅ Check yourself

1. What is middleware? What does `next()` do?
2. What does `app.use(express.json())` do, and what happens without it?
3. Difference between `req.params`, `req.query`, and `req.body`?
4. Which status code for: created something? Not found? Bad input? Deleted successfully?
5. Why is the URL `/books/5` better than `/getBook?id=5` in REST?

---

## 🛠️ Build: Books API 📚 (data stored in an array, in memory)

| Method | URL | What it does | Success status |
|---|---|---|---|
| GET | `/api/books` | list all books | 200 |
| GET | `/api/books/:id` | get one book | 200 (404 if missing) |
| POST | `/api/books` | create a book | 201 |
| PUT | `/api/books/:id` | replace a book | 200 (404 if missing) |
| DELETE | `/api/books/:id` | delete a book | 204 (404 if missing) |
| GET | `/api/books?author=Orwell` | filter by author | 200 |

A book looks like: `{ "id": 1, "title": "1984", "author": "George Orwell", "year": 1949 }`

### Setup
```bash
mkdir books-api && cd books-api
npm init -y
npm install express
# add "type": "module" and "scripts": { "dev": "node --watch app.js" }
```

### Suggested structure (learn to organize code)
```
books-api/
  app.js              ← creates the express app, adds middleware, mounts routes
  routes/books.js     ← express.Router() with the 5 routes
  data/books.js       ← the array + helper functions (findById, create, ...)
```

### Steps
- [ ] **Step 1:** Hello world Express app on port 3000.
- [ ] **Step 2:** `GET /api/books` returns a hardcoded array of 3 books.
- [ ] **Step 3:** `GET /api/books/:id` returns one book. Use `Number(req.params.id)`. Missing → `404 { "error": "Book not found" }`.
- [ ] **Step 4:** `POST /api/books`: add `express.json()` middleware, create the book with a new id, and return **201**.
- [ ] **Step 5:** If `title` or `author` is missing → **400** `{ "error": "title and author are required" }`.
- [ ] **Step 6:** `PUT` and `DELETE`.
- [ ] **Step 7:** Filter: `GET /api/books?author=orwell` (case-insensitive).
- [ ] **Step 8:** Move the routes into `routes/books.js` using `express.Router()`.
- [ ] **Step 9:** Write your own logging middleware: prints `METHOD URL STATUS time-ms`.
- [ ] **Step 10:** Unknown route → JSON 404 (a middleware at the end).
- [ ] **Step 11:** Save all your requests in a **Postman collection** and export it to the repo.
- [ ] **Step 12:** README listing every endpoint with an example request and response.

### ⭐ Stretch
- Pagination: `?page=2&limit=5`
- Sorting: `?sort=year`
- `PATCH /api/books/:id` (update only the fields sent)

### ✔️ Done when
All endpoints work in Postman with the correct status codes, bad input gives 400 (not a crash), and the code is split into routes/data files.

> 💡 Problem: restart the server and all your books disappear. → **Level 4 fixes this with a database.**

---

## 🆘 Common stuck points
| Problem | Hint |
|---|---|
| `req.body` is `undefined` | Add `app.use(express.json())` **before** your routes |
| Can't find a book by id | `req.params.id` is a **string** (`"1"`), but your ids are numbers. Use `Number()` |
| `Cannot set headers after they are sent` | You called `res.json()` twice. Use `return res.status(404).json(...)` |
| Postman POST doesn't work | Body tab → **raw** → **JSON** |

Stuck? Ask me: *"Level 3, Step 4: POST returns undefined. Code: ..."*
