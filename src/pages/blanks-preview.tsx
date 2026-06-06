/**
 * @file Dev preview harness for the `blanks` lens. Mounts the lens's
 * React `Component` DIRECTLY (importing the LensModule + `embody`),
 * bypassing the orchestrator's `LENS_REGISTRY` — `blanks` is not
 * registered until Inc 7 of the WS4 sprint. This page is the browser
 * eyeball surface for the per-increment sandbox checkpoints (Inc
 * 6a → 6j): type a snippet, toggle controls, and observe the lens.
 *
 * **How to use** (after `npm run start`):
 *
 * 1. Open `http://localhost:3000/spiralearn/blanks-preview` in a browser.
 * 2. Edit the snippet, toggle the controls (as they land per
 *    increment), and watch the lens re-mount as the redo progresses
 *    through increments 6a–6j.
 *
 * Inc 6a: wrapper mounts CodeMirror in read-only blankenated mode.
 * Difficulty hard-coded to 100 (every eligible token blanked) so the
 * `__` placeholders are maximally visible at the checkpoint.
 *
 * @vitest-skip — Docusaurus auto-routes `src/pages/*.tsx`; this is a
 * page, not a unit test.
 */

import Layout from '@theme/Layout';
import React from 'react';

import embody from '@site/src/lib/just-enough/javascript/embody/index.js';
import blanksLens from '@site/src/lib/just-enough/javascript/lenses/blanks/index.js';

const SAMPLE =
	'function classify(n) {\n\tif (n > 0) {\n\t\treturn "positive";\n\t}\n\treturn "non-positive";\n}';

/**
 * Inc 6.k comprehensive snippet — exercises every feature category the
 * blanks lens covers, plus syntactic-marker delimiters (`=>`, `?`, `:`,
 * `?.`, `...`) added in Inc 6.k. With all five content-type checkboxes
 * on at difficulty 100, every eligible token should be blanked.
 *
 * Categories covered:
 * - Keywords: import, from, class, extends, static, new, function,
 *   const, let, var, if, else, for, of, while, do, return, yield,
 *   async, await, try, catch, finally, throw, switch, case, break,
 *   continue, typeof, instanceof, delete, void, this, super, export,
 *   default
 * - Identifiers: variable / parameter / method names + private field #x
 * - Literals: strings, numbers, booleans, null, regex
 * - Operators: binary, unary, assignment, update, logical, nullish
 * - Delimiters: parens, brackets, braces, ${, semicolons, commas, dots,
 *   ARROW =>, ternary ? :, OPTIONAL ?., SPREAD ...
 */
const COMPREHENSIVE_SAMPLE = `import { Logger } from './logger.js';

class Counter extends Logger {
	#count = 0;
	static MAX = 100;

	constructor(initial = 0) {
		super();
		this.#count = initial;
	}

	get value() {
		return this.#count;
	}

	static fromObject({ initial = 0, step = 1 } = {}) {
		return new Counter(initial);
	}

	*iterate(n) {
		for (let i = 0; i < n; i++) yield this.#count + i;
	}

	async fetchAndIncrement() {
		try {
			const result = await Promise.resolve(this.#count + 1);
			this.#count = result;
			return result;
		} catch (error) {
			throw new Error(\`Failed: \${error.message}\`);
		} finally {
			console.log('done');
		}
	}
}

const items = [1, 2, 3, ...[4, 5]];
const total = items.reduce((acc, n) => acc + n, 0);
const isEven = (n) => n % 2 === 0 ? 'even' : 'odd';
const first = items?.[0] ?? 'default';
const re = /^\\d+$/g;

if (typeof first === 'number' && !isNaN(first)) {
	for (const item of items) {
		if (item > Counter.MAX) break;
		if (item === 0) continue;
		console.log(\`item: \${item}, parity: \${isEven(item)}\`);
	}
} else {
	switch (first) {
		case 'default':
			throw new RangeError('unknown');
		default:
			delete items[0];
			void console.log(\`got \${first}\`);
	}
}

export default Counter;`;

export default function BlanksPreview(): React.JSX.Element {
	const [code, setCode] = React.useState<string>(SAMPLE);

	return (
		<Layout title="blanks preview" description="WS4 blanks lens harness">
			<main style={{ maxWidth: 860, margin: '2rem auto', padding: '0 1rem' }}>
				<h1>blanks lens preview (WS4 — Inc 6a)</h1>
				<p>
					Inc 6a: wrapper mounts CodeMirror in read-only blankenated mode.
					Difficulty is set to 100 so every eligible token is blanked
					(maximum-visible <code>__</code> for the checkpoint). Subsequent
					increments add the view-mode toggle (6b), editable mode (6c),
					per-blank correctness (6d), difficulty slider (6e), content-type
					checkboxes (6f), editor header (6g), hints panel (6h), URL config
					(6i), and the Ask Me button backed by <code>socratizing/</code> (6j).
				</p>

				<div style={{ marginBottom: 8 }}>
					<button
						type="button"
						onClick={() => {
							setCode(SAMPLE);
						}}
						style={{ marginRight: 8 }}
					>
						Load minimal snippet
					</button>
					<button
						type="button"
						onClick={() => {
							setCode(COMPREHENSIVE_SAMPLE);
						}}
					>
						Load comprehensive Inc 6.k test snippet
					</button>
				</div>

				<label style={{ display: 'block', marginBottom: 8 }}>
					Snippet:
					<textarea
						value={code}
						onChange={function onCodeChange(event) {
							setCode(event.target.value);
						}}
						rows={12}
						style={{ width: '100%', fontFamily: 'monospace' }}
					/>
				</label>

				<div
					data-blanks-preview-mount
					style={{ border: '1px solid #ccc', padding: '1rem' }}
				>
					<blanksLens.Component
						key={code}
						embodiment={embody(code)}
						config={blanksLens.config({ difficulty: 100 })}
					/>
				</div>
			</main>
		</Layout>
	);
}
