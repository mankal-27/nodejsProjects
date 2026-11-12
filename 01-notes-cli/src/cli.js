#!/usr/bin/env node
// @ts-check
import { parseArgs } from 'node:util';
import { openStore } from './store.js';

const USAGE = `Usage:
  notes add <text> [--tag t]...
  notes list [--tag t] [--json]
  notes search <query> [--json]
  notes rm <id>
Options:
  --file <path>   store file (default: $NOTES_FILE or ~/.notes.json)`;

async function main(argv) {
  // TODO M4: parse argv with parseArgs({ args: argv, allowPositionals: true, options: {...} })
  // TODO M4: dispatch on the first positional (add | list | search | rm)
  // TODO M4: usage errors -> print USAGE to stderr, process.exitCode = 2
  throw new Error('TODO: implement the CLI');
}

main(process.argv.slice(2)).catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
