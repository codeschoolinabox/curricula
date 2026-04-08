/**
 * Sandbox for experimenting with the loop guard instrumentation.
 *
 * Usage:  npx vitest run src/lib/.../shared/guard-loops/sandbox.test.ts
 *
 * Edit the `code` template string below, save, re-run.
 */

import guardLoopsCondition from './guard-loops.js';

// --- Edit this code to experiment ---
const code = `\
while (x < 10) {
\tx++;
}
`;

const maxIterations = 100;

const result = guardLoopsCondition(code, maxIterations);

console.log(result);
