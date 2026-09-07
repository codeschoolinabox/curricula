/**
 * The differential oracle's generating probe (klve-121): runs the klve
 * package's built dist READ-ONLY over the differential corpus and writes
 * klve-differential.json beside itself. Regeneration is a deliberate,
 * named act — re-run this file under node and commit the diff.
 *
 * The dist executes each corpus program via its own new Function executor;
 * the corpus is small, closed, and side-effect-free beyond that.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const QUARRY_DIST =
	'/Users/master/Documents/0-teach-code/0-spiralearn/0-study-lenses-committee/sl-trace-js-klve/dist/record/index.js';

const CORPUS = [
	{ name: 'defaults-arithmetic', code: 'let x = 1 + 2; x;', options: {} },
	{
		name: 'defaults-strings-logs',
		code: 'let s = "a"; console.log(s + "b");',
		options: {},
	},
	{
		name: 'while-loop',
		code: 'let i = 0; while (i < 2) { i = i + 1; }',
		options: {},
	},
	{
		name: 'method-call',
		code: 'const o = { m: function () { return 7; } }; o.m();',
		options: {},
	},
	{
		name: 'node-toggle-off',
		code: 'let x = 1 + 2; x;',
		options: { access: { identifier: false } },
	},
	{
		name: 'timing-before-off',
		code: 'let i = 0; while (i < 2) { i = i + 1; }',
		options: { filter: { timing: { before: false } } },
	},
	{
		name: 'names-include',
		code: 'let a = 1; let b = 2; a; b;',
		options: { filter: { names: { include: ['a'] } } },
	},
	{
		name: 'data-stripped',
		code: 'let x = 5; x;',
		options: { filter: { data: { scopes: false, dt: false } } },
	},
	{
		name: 'logs-on-filtered-step',
		code: 'console.log("kept"); let x = 1; x;',
		options: { blocks: { expressionStatement: false } },
	},
	{
		name: 'cap-trip',
		code: 'let i = 0; while (true) { i = i + 1; }',
		options: {},
		max: { steps: 25, time: null, iterations: null, callstack: null },
	},
];

const { default: record } = await import(QUARRY_DIST);

const entries = [];
for (const { name, code, options, max } of CORPUS) {
	const meta = {
		max: max ?? { steps: null, time: null, iterations: null, callstack: null },
	};
	try {
		const steps = await record(code, { meta, options });
		entries.push({ name, code, options, steps });
	} catch (error) {
		entries.push({
			name,
			code,
			options,
			error: { name: error?.constructor?.name ?? 'Error', message: String(error?.message ?? error) },
		});
	}
}

const out = join(dirname(fileURLToPath(import.meta.url)), 'klve-differential.json');
writeFileSync(out, `${JSON.stringify({ generatedFrom: QUARRY_DIST, entries }, null, '\t')}\n`);
console.log(`wrote ${out} (${entries.length} entries)`);
