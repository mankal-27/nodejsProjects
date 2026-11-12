import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const rl = readline.createInterface({ input, output });
const randomNum = getRandomInt(1, 100);

while (true) {
    const answer = await rl.question('Your guess (1-100): ');
    const guess = Number(answer);

    if (answer.trim() === '' || Number.isNaN(guess)) {
        console.log('Please enter a valid number');
    } else if (guess < randomNum) {
        console.log('Too low');
    } else if (guess > randomNum) {
        console.log('Too high');
    } else {
        console.log('Correct!');
        break;
    }
}

rl.close();
