# Level 8: What to Learn Next

You finished the core path 🎉 You can now build, test, secure, and deploy a REST API.
Pick topics from here **one at a time**, based on what jobs near you ask for.
Each idea is a small add-on project.

---

## Next topics (recommended order)

| # | Topic | Why it matters | Study | Mini project |
|---|---|---|---|---|
| 1 | **TypeScript** | Most Node jobs use it | https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html and https://www.totaltypescript.com/tutorials/beginners-typescript | Convert your Task Manager to TypeScript |
| 2 | **File uploads** | Profile pictures, attachments | Multer: https://expressjs.com/en/resources/middleware/multer.html | Attach files to tasks |
| 3 | **Realtime (WebSockets)** | Chat, live notifications | Socket.IO tutorial: https://socket.io/docs/v4/tutorial/introduction | A chat app with rooms |
| 4 | **Caching with Redis** | Makes slow APIs fast | Redis University (free): https://university.redis.io and https://redis.io/docs/latest/develop/clients/nodejs/ | Cache the task list; rate limit with Redis |
| 5 | **Background jobs** | Emails, reports without making users wait | BullMQ: https://docs.bullmq.io | Email a daily "overdue tasks" summary |
| 6 | **Docker** | How apps are shipped | https://docker-curriculum.com and https://docs.docker.com/guides/nodejs/ | `docker compose up` runs API + Postgres + Redis |
| 7 | **MongoDB** | Common in Node jobs | Full Stack Open Part 3c: https://fullstackopen.com/en/part3/saving_data_to_mongo_db and https://learn.mongodb.com | Rebuild the Books API with MongoDB + Mongoose |
| 8 | **A second framework** | Different jobs, different stacks | Fastify: https://fastify.dev/docs/latest/Guides/Getting-Started/ or NestJS: https://docs.nestjs.com | Rebuild one API in Fastify or NestJS |
| 9 | **Security deeper** | Interview favorite | OWASP API Top 10: https://owasp.org/API-Security/ | Audit your Task Manager against the list |
| 10 | **System design basics** | Needed for mid/senior roles | https://github.com/donnemartin/system-design-primer | Design (on paper) a URL shortener |

---

## Portfolio project ideas (after Level 7)

Pick 1–2. Two **deep** projects beat ten tutorial clones.

| Project | Skills it shows |
|---|---|
| 🔗 **URL shortener** with click analytics | Redis caching, redirects, rate limiting |
| 💬 **Realtime chat** with rooms + message history | WebSockets, auth, DB |
| 🛒 **E-commerce backend** (products, cart, orders, Stripe test mode) | Transactions, webhooks, roles, background jobs |
| 📅 **Event booking API** (seats can't be double-booked) | Transactions, locking, concurrency |
| 📰 **Blog platform API** (posts, comments, likes, tags, search) | Relations, pagination, full-text search |

---

## When you feel ready for "under the hood" Node

The folders `01-notes-cli` … `11-plugin-runner` in `nodejsProjects/` are **advanced** projects that
rebuild things like Express, a static server, and an auth library using only Node built-ins.
Projects 01–04 come with test suites that tell you when you're done.
Come back to them **after** Level 7. They'll make much more sense then.

Also useful later:
- *Node.js Design Patterns* (book by Casciaro & Mammino)
- Node.js best practices: https://github.com/goldbergyoni/nodebestpractices
- Backend roadmap: https://roadmap.sh/backend
- `extra-reference/` in this folder: a dictionary of every Node module and backend concept
