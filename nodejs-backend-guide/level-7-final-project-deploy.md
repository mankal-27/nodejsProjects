# Level 7: Portfolio Project, Task Manager API (+ Deploy Online)

**Goal:** Build a complete backend **on your own** using everything from Levels 1–6, put it on the internet, and make it portfolio ready.
**Time:** 3–4 weeks

This time there are fewer step-by-step instructions on purpose. You plan it.
(You can still ask me for help or a review at any point.)

---

## 📖 Study (only the new parts)

- [ ] Planning a database (ER diagrams): draw yours at https://dbdiagram.io
- [ ] Database transactions (BEGIN/COMMIT): https://node-postgres.com/features/transactions
- [ ] Pagination and filtering design: https://www.moesif.com/blog/technical/api-design/REST-API-Design-Filtering-Sorting-and-Pagination/
- [ ] API documentation with Swagger/OpenAPI: https://swagger.io/docs/specification/v3_0/about/ (use `swagger-ui-express`: https://www.npmjs.com/package/swagger-ui-express)
- [ ] **Deploying:**
  - Full Stack Open, Part 3b: Deploying app to the internet: https://fullstackopen.com/en/part3/deploying_app_to_internet
  - Render (free tier) Express deploy guide: https://render.com/docs/deploy-node-express-app
  - Free hosted Postgres: Neon (https://neon.tech)
- [ ] (Optional) Docker for beginners: https://docker-curriculum.com
- [ ] Writing a good README: https://www.makeareadme.com

---

## 🛠️ Build: Task Manager API ✅

Like a mini Trello/Todoist backend.

### Features (requirements)

**Users**
- [ ] Sign up, log in (JWT), `GET /me`

**Projects**
- [ ] A user can create, list, rename, and delete their projects
- [ ] Users only see **their own** projects

**Tasks** (belong to a project)
- [ ] Create a task: `title`, `description`, `status` (`todo` / `in_progress` / `done`), `priority` (`low` / `medium` / `high`), `due_date`
- [ ] List tasks in a project, with:
  - filter: `?status=todo&priority=high`
  - sort: `?sort=due_date`
  - pagination: `?page=1&limit=10` → response includes `total`
- [ ] Update a task (`PATCH`, partial), delete a task
- [ ] `GET /api/tasks/overdue`: all your tasks past their due date and not done
- [ ] Deleting a project deletes its tasks (use a **transaction** or `ON DELETE CASCADE`)

**Quality**
- [ ] Zod validation on every input
- [ ] One error format
- [ ] Tests for the main flows (aim for 15+ tests)
- [ ] `.env` config, `.env.example`
- [ ] Swagger docs at `/docs`
- [ ] Deployed online with a live URL

### Your planning steps (do these BEFORE coding)
1. **Draw the database** (users, projects, tasks) on dbdiagram.io. Which foreign keys?
2. **Write the endpoint list** in your README (method, URL, auth needed?, request body, response).
3. **Break it into milestones**, for example:
   - Week 1: project setup, DB schema, auth (copy and improve your Level 5/6 code)
   - Week 2: projects + tasks CRUD with ownership checks
   - Week 3: filters, sorting, pagination, overdue endpoint, tests
   - Week 4: Swagger docs, deploy, README polish

> 💡 Send me your DB diagram + endpoint list before coding and I'll review the design.

### Deploy checklist
- [ ] Create a free Postgres on Neon and run your `schema.sql` there
- [ ] Push the code to GitHub
- [ ] Render → New Web Service → connect the repo → set env vars (`DATABASE_URL`, `JWT_SECRET`)
- [ ] Test the live URL in Postman
- [ ] Put the live URL + Swagger link at the top of your README

### Portfolio-ready README checklist
- [ ] One-sentence description + live demo link
- [ ] Tech stack (Node, Express, PostgreSQL, JWT, Zod, Jest/node:test)
- [ ] DB diagram image
- [ ] Endpoint table
- [ ] How to run locally (step by step)
- [ ] How to run tests
- [ ] "What I learned" + "What I'd improve next"

### ✔️ Done when
Someone else can open your GitHub, read the README, try the live API in Swagger, and run it locally by following your instructions.

---

## 🆘 Common stuck points
| Problem | Hint |
|---|---|
| App works locally but crashes on Render | Check the Render logs. Usually a missing env var, or you listen on a hardcoded port: use `process.env.PORT` |
| Neon connection fails | Add `?sslmode=require` to the connection string |
| User A can see user B's tasks | Every query must include `WHERE user_id = $1` (or join through projects) |
| Pagination total is wrong | You need a separate `SELECT COUNT(*)` with the same filters |

Stuck? Ask me: *"Level 7: review my DB design"* or *"Level 7: my deploy fails, here are the logs: ..."*
