# Level 1: Node.js Basics (Modules, Files, npm)

**Goal:** Understand what Node.js is, split code into modules, read/write files, and use npm packages.
**Time:** 1 week

---

## 📖 Study (in this order)

- [ ] What is Node.js? https://nodejs.org/en/learn/getting-started/introduction-to-nodejs
- [ ] The Odin Project, NodeJS course, first lessons ("Introduction: What is NodeJS?" and "Getting Started"):
  https://www.theodinproject.com/paths/full-stack-javascript/courses/nodejs
- [ ] Reading files: https://nodejs.org/en/learn/manipulating-files/reading-files-with-nodejs
- [ ] Writing files: https://nodejs.org/en/learn/manipulating-files/writing-files-with-nodejs
- [ ] File paths (`node:path`): https://nodejs.org/en/learn/manipulating-files/nodejs-file-paths
- [ ] Command-line arguments (`process.argv`): https://nodejs.org/en/learn/command-line/run-nodejs-scripts-from-the-command-line
  and https://nodejs.org/api/process.html#processargv
- [ ] npm basics: https://nodejs.org/en/learn/getting-started/an-introduction-to-the-npm-package-manager
- [ ] `package.json` explained: https://docs.npmjs.com/cli/v10/configuring-npm/package-json (read only "name", "version", "scripts", "dependencies")
- [ ] The event loop, beginner version: https://nodejs.org/en/learn/asynchronous-work/javascript-asynchronous-programming-and-callbacks

**Video option:** search YouTube for *"Node.js Crash Course Traversy Media"* (about 1.5 h, very beginner friendly).

**Interactive option:** https://nodeschool.io. Install `learnyounode` and do exercises 1–6.

---

## ✅ Check yourself

1. What's the difference between JavaScript in the browser and in Node.js?
2. What does `export` / `import` do? How do you share a function between two files?
3. What's the difference between `fs.readFileSync` and `await fs.promises.readFile`? Which one blocks?
4. What is `package.json` for? What does `npm install` do? What is `node_modules`?
5. What is in `process.argv`?

---

## 🛠️ Build: Todo List CLI 📝

A terminal todo app that **remembers your todos** in a `todos.json` file.

```bash
node todo.js add "Buy milk"
node todo.js list
#  1. [ ] Buy milk
node todo.js done 1
node todo.js list
#  1. [x] Buy milk
node todo.js delete 1
```

### Setup
```bash
mkdir todo-cli && cd todo-cli
npm init -y
# add "type": "module" to package.json
```

### Suggested files
```
todo-cli/
  todo.js        ← reads the command and calls functions
  storage.js     ← loadTodos() and saveTodos(): the only file that touches the file system
  package.json
```

### Steps
- [ ] **Step 1:** In `todo.js`, print `process.argv` and see what's inside. Get the command (`add`, `list`...) and the text.
- [ ] **Step 2:** In `storage.js`, write `saveTodos(todos)`, which writes an array to `todos.json` with `JSON.stringify(todos, null, 2)`.
- [ ] **Step 3:** Write `loadTodos()`, which reads `todos.json` and returns the array. **If the file doesn't exist, return `[]`** (use `try/catch`).
- [ ] **Step 4:** Implement `add`. A todo looks like `{ id: 1, text: "Buy milk", done: false }`.
- [ ] **Step 5:** Implement `list` with the nice `[ ]` / `[x]` output.
- [ ] **Step 6:** Implement `done <id>` and `delete <id>`. Print an error if the id doesn't exist.
- [ ] **Step 7:** Unknown command or missing text → print a help message.
- [ ] **Step 8:** Use your first npm package: `npm install chalk` and color done items green. (See https://www.npmjs.com/package/chalk)
- [ ] **Step 9:** Add `"scripts": { "start": "node todo.js" }` to `package.json`.
- [ ] **Step 10:** README + push to GitHub.

### ⭐ Stretch
- `node todo.js clear` removes all done items
- Due dates: `add "Pay rent" --due 2026-12-01`, and `list` shows overdue items in red
- Use `node:util` `parseArgs` for flags: https://nodejs.org/api/util.html#utilparseargsconfig

### ✔️ Done when
Todos survive closing the terminal, wrong commands show help, and nothing crashes on a fresh folder with no `todos.json`.

---

## 🆘 Common stuck points
| Problem | Hint |
|---|---|
| `ENOENT: no such file or directory` | The file doesn't exist yet. Catch the error and return `[]` |
| `todos.json` gets created in a weird folder | Paths are relative to where you **run** the command. Use `path.join(import.meta.dirname, 'todos.json')` |
| ids repeat after deleting | Use `Math.max(...ids) + 1`, or `crypto.randomUUID()` |
| `[object Object]` printed | Use `JSON.stringify(obj)` or template strings with specific fields |

Stuck? Ask me: *"Level 1, Step 3: loadTodos crashes when the file is missing. Code: ..."*
