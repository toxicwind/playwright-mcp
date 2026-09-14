#!/usr/bin/env node
/**
 * Re-applies this fork's README preamble after an upstream sync.
 *
 * The canonical preamble lives in .github/fork-preamble.md. This script
 * inserts it at the top of README.md between marker comments, idempotently:
 * run it any time, e.g. after merging upstream/main touches README.md.
 *
 *   node apply-fork-preamble.js
 */

const fs = require('fs');
const path = require('path');

const root = __dirname;
const START = '<!-- FORK-PREAMBLE-START -->';
const END = '<!-- FORK-PREAMBLE-END -->';

const preamble = fs.readFileSync(path.join(root, '.github', 'fork-preamble.md'), 'utf8').trim() + '\n';
const readmePath = path.join(root, 'README.md');
let readme = fs.readFileSync(readmePath, 'utf8');

const block = `${START}\n${preamble}${END}\n\n`;
// eslint-disable-next-line no-control-regex
const existing = new RegExp(`${START}[\\s\\S]*?${END}\n\n`);
if (existing.test(readme))
  readme = readme.replace(existing, block);
else
  readme = block + readme;

fs.writeFileSync(readmePath, readme);
console.log('Fork preamble applied to README.md');
