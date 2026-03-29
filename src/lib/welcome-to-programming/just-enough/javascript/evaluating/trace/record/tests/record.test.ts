/**
 * @file Integration tests for record().
 *
 * Requires Web Worker + SharedArrayBuffer (Aran tracer runs in a
 * Worker). These todos need a browser-like test runner (e.g. vitest
 * with browser mode or Playwright).
 *
 * Iteration limit behavior is covered at the API level via mocked
 * generator in `api/tests/trace.test.ts`.
 */

import { describe, it } from 'vitest';

describe('record', () => {
	it.todo('traces simple code and returns steps');
	it.todo('returns parse error for invalid syntax');
	it.todo('returns runtime error for throwing code');
	it.todo('returns iteration-limit error when loop exceeds maxIterations');
	it.todo('returns timeout error when time limit exceeded');
});
