import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function checkGuess(secret, guess) {
    if (guess < secret) return 'low';
    if (guess > secret) return 'high';
    return 'correct';
}

const rl = readline.createInterface({ input, output });

let playAgain = true;
while (playAgain) {
    const secret = getRandomInt(1, 100);
    let counter = 0;

    while (true) {
        const answer = await rl.question('Your guess (1-100): ');
        const guess = Number(answer);
        if (answer.trim() === '' || Number.isNaN(guess)) {
            console.log('Please enter a valid number');
            continue;
        }
        counter++;
        const result = checkGuess(secret, guess);
        if (result === 'low') {
            console.log('Too low');
        } else if (result === 'high') {
            console.log('Too high');
        } else {
            console.log('Correct!');
            console.log(`You guessed in ${counter} tries`);
            break;
        }
    }

    let reply;
    do {
        reply = (await rl.question('Play again? (y/n) ')).trim().toLowerCase();
    } while (reply !== 'y' && reply !== 'n');
    playAgain = reply === 'y';
}

rl.close();
