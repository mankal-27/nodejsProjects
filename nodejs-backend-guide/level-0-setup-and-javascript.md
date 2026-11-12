# Level 0: Setup + The JavaScript You Need

**Goal:** Install your tools and get comfortable with the JavaScript that backend code uses every day.
**Time:** 1–2 weeks
**Skip this level if:** you can already write functions, use arrays/objects, and explain `async/await`.

---

## 📖 Study (in this order)

### Part A: Tools (1 day)
- [ ] Install Node.js (LTS version): https://nodejs.org/en/download, then check with `node -v` and `npm -v`
- [ ] Install VS Code: https://code.visualstudio.com
- [ ] Terminal basics (cd, ls, mkdir): https://www.theodinproject.com/lessons/foundations-command-line-basics
- [ ] Git basics: https://www.theodinproject.com/lessons/foundations-git-basics
- [ ] Practice git visually (play levels 1–4): https://learngitbranching.js.org
- [ ] Make a free GitHub account: https://github.com

### Part B: JavaScript (javascript.info is your main book)
Read these chapters and run the examples yourself:
- [ ] Basics (variables, types, `if`, loops, functions): https://javascript.info/first-steps
- [ ] Objects: https://javascript.info/object-basics (read "Objects" and "Object references and copying")
- [ ] Arrays and array methods (`map`, `filter`, `find`, `reduce`): https://javascript.info/array-methods
- [ ] Destructuring: https://javascript.info/destructuring-assignment
- [ ] JSON: https://javascript.info/json
- [ ] Errors, `try...catch`: https://javascript.info/try-catch
- [ ] Modules (`import` / `export`): https://javascript.info/modules-intro
- [ ] ⭐ **Async** (the most important part for backend):
  - Callbacks: https://javascript.info/callbacks
  - Promises: https://javascript.info/promise-basics
  - async/await: https://javascript.info/async-await

**Optional video:** search YouTube for *"JavaScript Tutorial for Beginners Programming with Mosh"*
or *"freeCodeCamp JavaScript full course"* if you prefer watching.

**Practice exercises (free):** https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/
(do the first ~30 steps)

---

## ✅ Check yourself (answer without looking)

1. What's the difference between `let`, `const`, and `var`?
2. Given `const users = [{name:'a', age: 20}, {name:'b', age: 15}]`, how do you get only adults with `filter`?
3. What does `JSON.stringify` do? What about `JSON.parse`?
4. What is a Promise? What does `await` do?
5. What happens if a promise fails and you don't use `try/catch`?

If you can't answer one, re-read that chapter, or ask me: *"Explain promises like I'm a beginner"*.

---

## 🛠️ Build: Number Guessing Game 🎲

A terminal game: the computer picks a number from 1–100, you guess, and it says "too high" or "too low".

### Setup
```bash
mkdir guess-game
cd guess-game
npm init -y
```
Open `package.json` and add `"type": "module",` (so you can use `import`).
Create `index.js`. Run it with `node index.js`.

### Starter code (to read input)
This is the only part given to you. You write everything else.
```js
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });
const answer = await rl.question('Your guess: ');
console.log('You typed', answer);
rl.close();
```

### Steps (do one at a time, run it after each)
- [ ] **Step 1:** Pick a random number 1–100 (hint: `Math.random()`, `Math.floor()`).
- [ ] **Step 2:** Ask for one guess and print "too high", "too low", or "correct!".
- [ ] **Step 3:** Use a loop so it keeps asking until the guess is correct.
- [ ] **Step 4:** Count the attempts. Print "You won in 7 tries!".
- [ ] **Step 5:** Handle bad input: if the user types `abc`, say "Please enter a number" (hint: `Number()`, `Number.isNaN()`).
- [ ] **Step 6:** At the end ask "Play again? (y/n)".
- [ ] **Step 7:** Put the game logic in a function `checkGuess(secret, guess)` that returns `'high' | 'low' | 'correct'`.
- [ ] **Step 8:** Push to GitHub with a short README.

### ⭐ Stretch
- Difficulty levels (easy 1–50, hard 1–1000)
- Save the best score to a file (you'll learn how in Level 1)

### ✔️ Done when
You can play the full game, bad input doesn't crash it, and the code is on GitHub.

---

## 🆘 Common stuck points
| Problem | Hint |
|---|---|
| `SyntaxError: Cannot use import statement outside a module` | Add `"type": "module"` to `package.json` |
| Guess `"50"` never equals the number `50` | Input is a **string**. Convert it with `Number(answer)` |
| `await is only valid in async functions` | Top-level `await` works only in modules (`"type": "module"`) |
| Program doesn't exit | You forgot `rl.close()` |

Stuck? Ask me: *"Level 0, Step 3: my loop never stops. Here's my code: ..."*
