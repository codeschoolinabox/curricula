/**
 * @file Dev preview harness for the `blanks` lens. Mounts the lens's
 * React `Component` directly (importing the `LensModule` + `embody`)
 * rather than going through the orchestrator's `LENS_REGISTRY` — the
 * lens IS registered (consumers can reach it via the L1 picker too),
 * but this page deliberately bypasses the registry so the lens
 * surface is isolated from picker/orchestrator state for sandbox
 * observation.
 *
 * Open `http://localhost:3000/spiralearn/blanks-preview` in a browser
 * after `npm run start`. Edit the snippet textarea, click the
 * "comprehensive" button for the multi-feature test snippet, and
 * exercise the controls.
 *
 * Difficulty is hard-coded to 100 (every eligible token blanked) so
 * the `_` placeholders are maximally visible.
 *
 * @vitest-skip — Docusaurus auto-routes `src/pages/*.tsx`; this is a
 * page, not a unit test.
 */

import Layout from '@theme/Layout';
import React from 'react';

import embody from '@site/src/lib/study-lenses/embody/index.js';
import blanksLens from '@site/src/lib/study-lenses/lenses/blanks/index.js';

const SAMPLE =
	'function classify(n) {\n\tif (n > 0) {\n\t\treturn "positive";\n\t}\n\treturn "non-positive";\n}';

/**
 * Comprehensive test snippet — exercises every feature category the
 * blanks lens covers. With all five content-type checkboxes on at
 * difficulty 100, every eligible token should be blanked.
 *
 * Categories covered:
 * - Keywords: import, from, class, extends, static, new, function,
 *   const, let, var, if, else, for, of, while, do, return, yield,
 *   async, await, try, catch, finally, throw, switch, case, break,
 *   continue, typeof, instanceof, delete, void, this, super, export,
 *   default.
 * - Identifiers: variable / parameter / method names + private field
 *   `#x`.
 * - Literals: strings, numbers, booleans, null, regex, template-
 *   literal text chunks.
 * - Operators: binary, unary, assignment, update, logical, nullish.
 * - Delimiters: parens, brackets, braces, `${`, semicolons, commas,
 *   dots, arrow `=>`, ternary `?` / `:`, optional `?.`, spread
 *   `...`, template backticks `` ` ``, and generator `*`.
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
				<h1>blanks lens preview</h1>
				<p>
					Dev harness for the blanks lens. The textarea below feeds an
					embodiment into the lens; the wrapper renders the blankenated source
					with length-matched <code>_</code>
					placeholders, view-mode toggle, editor-mode sub-toggle, difficulty
					slider, content-type checkboxes, editor header, cursor-scoped hints
					panel, and URL-config plumbing. Difficulty is hard-coded to 100 so
					every eligible token is blanked.
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
						Load comprehensive test snippet
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
