import { describe, expect, it } from 'vitest';

import createInterceptGenerator from '../intercept.js';

/**
 * Validation + format gate tests for the merged engine.
 *
 * After the api/run → evaluating/run merge (M.1), createInterceptGenerator
 * runs the validation and format gates lazily inside the generator
 * body, before any Worker is spawned. Failures return immediate error
 * InterceptResults without touching the Worker code path.
 *
 * ZOMBIES ordering within each gate:
 *   Z — simplest/empty case
 *   O — one failure on line 1
 *   M — multiple / different line to triangulate line-number reporting
 *   I — cancel-supersedes-gates (interface-level ordering)
 */

describe('createInterceptGenerator validation gate', () => {
	describe('parse failure', () => {
		describe('happy path', () => {
			it('line-1 parse error → ok:false', async () => {
				const handle = createInterceptGenerator('let x =;');
				const result = await handle.result;
				expect(result.ok).toBe(false);
			});

			it('line-1 parse error → kind = parse', async () => {
				const handle = createInterceptGenerator('let x =;');
				const result = await handle.result;
				if (result.ok) throw new Error('expected !ok');
				expect(result.error?.kind).toBe('parse');
			});

			it('line-1 parse error → line = 1', async () => {
				const handle = createInterceptGenerator('let x =;');
				const result = await handle.result;
				if (result.ok) throw new Error('expected !ok');
				if (result.error?.kind !== 'parse') {
					throw new Error(`expected parse, got ${result.error?.kind}`);
				}
				expect(result.error.line).toBe(1);
			});

			it('line-2 parse error → line = 2 (triangulates line number)', async () => {
				const handle = createInterceptGenerator('let x = 1;\nlet y =;');
				const result = await handle.result;
				if (result.ok) throw new Error('expected !ok');
				if (result.error?.kind !== 'parse') {
					throw new Error(`expected parse, got ${result.error?.kind}`);
				}
				expect(result.error.line).toBe(2);
			});

			it('parse-fail result has empty events array (no worker ran)', async () => {
				const handle = createInterceptGenerator('let x =;');
				const result = await handle.result;
				if (result.ok) throw new Error('expected !ok');
				expect(result.events).toEqual([]);
			});
		});
	});

	describe('JeJ rejection', () => {
		describe('happy path', () => {
			it('var declaration → ok:false', async () => {
				const handle = createInterceptGenerator('var x = 5;\n');
				const result = await handle.result;
				expect(result.ok).toBe(false);
			});

			it('var declaration → error.kind: validation', async () => {
				const handle = createInterceptGenerator('var x = 5;\n');
				const result = await handle.result;
				if (result.ok) throw new Error('expected !ok');
				expect(result.error?.kind).toBe('validation');
			});

			it('one var declaration → exactly one violation', async () => {
				const handle = createInterceptGenerator('var x = 5;\n');
				const result = await handle.result;
				if (result.ok) throw new Error('expected !ok');
				if (result.error?.kind !== 'validation') {
					throw new Error(`expected validation, got ${result.error?.kind}`);
				}
				expect(result.error.violations.length).toBe(1);
			});

			it('two var declarations → two violations (triangulates count)', async () => {
				const handle = createInterceptGenerator('var x = 5;\nvar y = 6;\n');
				const result = await handle.result;
				if (result.ok) throw new Error('expected !ok');
				if (result.error?.kind !== 'validation') {
					throw new Error(`expected validation, got ${result.error?.kind}`);
				}
				expect(result.error.violations.length).toBe(2);
			});
		});
	});

	describe('format gate', () => {
		describe('happy path', () => {
			// Definitely valid JeJ (no `var`, no `with`), parses, no rejections;
			// just unformatted (extra whitespace). Isolates format-gate failure.
			it('unformatted valid JeJ → ok:false', async () => {
				const handle = createInterceptGenerator('let   x = 5;\n');
				const result = await handle.result;
				expect(result.ok).toBe(false);
			});

			it('unformatted valid JeJ → kind = formatting', async () => {
				const handle = createInterceptGenerator('let   x = 5;\n');
				const result = await handle.result;
				if (result.ok) throw new Error('expected !ok');
				expect(result.error?.kind).toBe('formatting');
			});

			it('format-fail result has empty events array (no worker ran)', async () => {
				const handle = createInterceptGenerator('let   x = 5;\n');
				const result = await handle.result;
				if (result.ok) throw new Error('expected !ok');
				expect(result.events).toEqual([]);
			});
		});
	});

	describe('gate ordering — cancel supersedes gates', () => {
		it('cancel before first iterate → ok:true (bypasses validation)', async () => {
			const handle = createInterceptGenerator('let x =;'); // would parse-fail
			handle.cancel();
			const result = await handle.result;
			expect(result.ok).toBe(true);
		});
	});

	describe('gate ordering — validation precedes format', () => {
		// Input is BOTH JeJ-rejected (var) AND unformatted (no trailing newline).
		// Proves validation runs first: result carries rejections, not a
		// formatting error.
		it('rejected + unformatted → error.kind: validation, not formatting', async () => {
			const handle = createInterceptGenerator('var x=5;');
			const result = await handle.result;
			if (result.ok) throw new Error('expected !ok');
			expect(result.error?.kind).toBe('validation');
		});
	});
});
