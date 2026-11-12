# Level 2: How the Web Works + Your First Server

**Goal:** Understand requests, responses, URLs, status codes, and headers, then build a server with **no framework**.
**Time:** 1 week

---

## 📖 Study (in this order)

- [ ] How the web works (client, server, DNS): https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works
- [ ] HTTP overview (requests and responses): https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview
- [ ] HTTP methods (GET, POST, PUT, DELETE): https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods
- [ ] Status codes, just the common ones (200, 201, 400, 401, 404, 500): https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
- [ ] What a URL is made of: https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_URL
- [ ] Your first Node server: https://nodejs.org/en/learn/getting-started/introduction-to-nodejs (the "example Node.js application" section)
- [ ] ⭐ Anatomy of an HTTP transaction (the most useful page): https://nodejs.org/en/learn/http/anatomy-of-an-http-transaction
- [ ] The Odin Project NodeJS course: do the "Basic Informational Site" project lesson: https://www.theodinproject.com/paths/full-stack-javascript/courses/nodejs
- [ ] curl basics: run `curl -i https://api.github.com` and look at the headers

**Tool:** Install a REST client to send requests: **Postman** (https://www.postman.com/downloads/)
or the **Thunder Client** VS Code extension.

---

## ✅ Check yourself

1. What happens, step by step, when you type `google.com` into a browser?
2. What's the difference between GET and POST?
3. What do the status codes 200, 201, 400, 404, and 500 mean?
4. What is a header? What does `Content-Type: application/json` tell the browser?
5. In `http://localhost:3000/about?lang=en`, which part is the host, the port, the path, and the query?

---

## 🛠️ Build: Mini Website Server 🌐 (only `node:http`, no Express)

```
GET /               → home page (HTML)
GET /about          → about page (HTML)
GET /contact        → contact page (HTML)
GET /api/time       → {"time": "2026-11-12T10:00:00.000Z"}  (JSON)
GET /api/hello?name=Ada → {"message": "Hello, Ada!"}
anything else       → 404 page
```

### Setup
```
mini-server/
  server.js
  pages/
    index.html
    about.html
    contact.html
    404.html
```

### Starter (the only code given)
```js
import http from 'node:http';

const server = http.createServer((req, res) => {
  console.log(req.method, req.url);
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello!');
});

server.listen(3000, () => console.log('http://localhost:3000'));
```

### Steps
- [ ] **Step 1:** Run the starter and open http://localhost:3000. Watch the terminal log (why are there 2 requests? Hint: favicon).
- [ ] **Step 2:** Use `if (req.url === '/about')` to return different text for different paths.
- [ ] **Step 3:** Make simple HTML files in `pages/`. Read them with `fs/promises` and send them with `Content-Type: text/html`.
- [ ] **Step 4:** Unknown path → send `404.html` with **status code 404** (check it in the browser DevTools Network tab).
- [ ] **Step 5:** `/api/time` → return JSON with `Content-Type: application/json`.
- [ ] **Step 6:** `/api/hello?name=Ada` → parse the query with `new URL(req.url, 'http://localhost')` and `url.searchParams.get('name')`.
- [ ] **Step 7:** Only allow GET. Any other method gets `405 Method Not Allowed`. Test with Postman or `curl -X POST`.
- [ ] **Step 8:** Log every request like `GET /about 200 3ms` (hint: `Date.now()` before and after).
- [ ] **Step 9:** README + GitHub.

### ⭐ Stretch
- `POST /api/echo`: read the JSON body sent by the client and send it back (hint: `req.on('data')` / `req.on('end')`)
- Serve a CSS file and an image (set the right Content-Type)

### ✔️ Done when
All routes work in the browser and in Postman, the 404 page has status 404, and you can explain what `req` and `res` are.

> 💡 After this level you'll see **why Express exists**: the `if/else` routing gets messy fast.

---

## 🆘 Common stuck points
| Problem | Hint |
|---|---|
| `EADDRINUSE: address already in use :::3000` | The server is already running in another terminal. Stop it with Ctrl+C or use another port |
| Browser shows HTML as plain text | Wrong `Content-Type`. Use `text/html` |
| The request hangs forever | You forgot `res.end()` in some branch |
| `/api/hello?name=Ada` doesn't match `/api/hello` | `req.url` includes the query. Use `new URL(...).pathname` |

Stuck? Ask me: *"Level 2, Step 6: my query param is null. Code: ..."*
