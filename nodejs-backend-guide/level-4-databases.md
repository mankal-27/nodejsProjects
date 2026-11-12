# Level 4: Databases (SQL + PostgreSQL)

**Goal:** Learn SQL, set up PostgreSQL, and make the Books API save data permanently.
**Time:** 2 weeks

> Why SQL/PostgreSQL? It's the most used database in backend jobs. Once you know it,
> MongoDB is easy to pick up later (Full Stack Open Part 3c teaches MongoDB if you're curious).

---

## 📖 Study (in this order)

### Part A: Learn SQL (no Node yet)
- [ ] What is a database (short read): https://www.postgresqltutorial.com/postgresql-getting-started/what-is-postgresql/
- [ ] ⭐ **SQLBolt**: interactive SQL lessons in the browser. Do lessons 1–12, then 13–18:
  https://sqlbolt.com
- [ ] SELECT, WHERE, ORDER BY, JOIN on real tables: https://www.postgresqltutorial.com (the "Basic PostgreSQL Tutorial" section)
- [ ] Primary keys & foreign keys: https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-foreign-key/

### Part B: Install PostgreSQL (pick one)
- **Mac (easiest):** Postgres.app: https://postgresapp.com
- **Or online, free:** Neon (hosted Postgres, no install): https://neon.tech
- GUI to view your data: **TablePlus** (https://tableplus.com) or **pgAdmin** (https://www.pgadmin.org)

### Part C: Use it from Node
- [ ] node-postgres (`pg`) getting started: https://node-postgres.com
- [ ] Queries with parameters (`$1`, `$2`): https://node-postgres.com/features/queries
- [ ] Connection pool: https://node-postgres.com/features/pooling
- [ ] ⚠️ SQL injection (why you must use `$1` parameters): https://owasp.org/www-community/attacks/SQL_Injection
- [ ] Odin Project NodeJS course, the "Databases" / "Using PostgreSQL" lessons:
  https://www.theodinproject.com/paths/full-stack-javascript/courses/nodejs

**Video option:** search YouTube for *"SQL Tutorial for Beginners freeCodeCamp"* or *"PostgreSQL Tutorial for Beginners Amigoscode"*.

---

## ✅ Check yourself

1. Write SQL for: all books by "Orwell" published after 1940, newest first.
2. What is a primary key? A foreign key?
3. What is a JOIN? Write one that lists books with their author's name (two tables).
4. Why is `"SELECT * FROM books WHERE id = " + req.params.id` dangerous? What's the safe way?
5. What is a connection pool and why use one?

---

## 🛠️ Build: Books API v2, with PostgreSQL 📚

Same endpoints as Level 3, but data is saved in Postgres, plus a new `authors` table.

### Database design
```sql
CREATE TABLE authors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  year INTEGER,
  author_id INTEGER NOT NULL REFERENCES authors(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Steps
- [ ] **Step 1:** Copy your Level 3 project to `books-api-db` (or make a new git branch).
- [ ] **Step 2:** Create a database `books_db`. Run the SQL above in TablePlus/psql. Insert 2 authors and 3 books by hand.
- [ ] **Step 3:** `npm install pg`. Create `db.js` that exports a `Pool`. Test it with `SELECT now()`.
- [ ] **Step 4:** Rewrite `GET /api/books` to use `SELECT`. **Always use `$1` parameters.**
- [ ] **Step 5:** `GET /api/books/:id` → returns 404 if `rows.length === 0`.
- [ ] **Step 6:** `POST`, `PUT`, `DELETE` using `INSERT ... RETURNING *`, `UPDATE ... RETURNING *`, `DELETE`.
- [ ] **Step 7:** New endpoints: `GET /api/authors`, `POST /api/authors`, and `GET /api/authors/:id/books`.
- [ ] **Step 8:** `GET /api/books` returns the author's name using a **JOIN**.
- [ ] **Step 9:** Creating a book with a non-existent `author_id` → return 400 (not 500!). Hint: catch the error and check `err.code === '23503'`.
- [ ] **Step 10:** Put the SQL in a `schema.sql` file and add an `npm run db:setup` script that runs it (`psql -f schema.sql`).
- [ ] **Step 11:** Restart the server and confirm the data is still there 🎉
- [ ] **Step 12:** Update the README with setup instructions.

### ⭐ Stretch
- Pagination with `LIMIT` and `OFFSET`
- Search: `?q=animal` using `ILIKE`
- Add an index on `books.author_id` and learn why: https://use-the-index-luke.com/sql/preface
- Try an ORM afterwards (Prisma: https://www.prisma.io/docs/getting-started), but only after you can write the SQL yourself

### ✔️ Done when
Data survives restarts, all queries use parameters, the JOIN works, and bad author ids give 400.

---

## 🆘 Common stuck points
| Problem | Hint |
|---|---|
| `ECONNREFUSED 127.0.0.1:5432` | Postgres isn't running. Open Postgres.app |
| `password authentication failed` | Check the connection string: `postgres://user:password@localhost:5432/books_db` |
| `relation "books" does not exist` | You didn't create the table, or you're connected to the wrong database |
| `rows` is empty but you inserted data | Check you're querying the same database you inserted into |
| Your connection string is committed to GitHub | Level 6 teaches `.env`. For now, don't push real passwords |

Stuck? Ask me: *"Level 4, Step 8: my JOIN returns duplicate rows. Query: ..."*
