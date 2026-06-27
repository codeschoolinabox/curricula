import { describe, expect, it } from 'vitest';

import promoteTerminal from '../promote-terminal-cause.js';
import type { AttemptCause, LoadAttempt } from '../types.js';

const attempt = (cause: AttemptCause): LoadAttempt => ({
	id: 'candidate',
	runtime: 'webllm',
	cause,
});

const ledger = (
	first: AttemptCause,
	...rest: readonly AttemptCause[]
): readonly [LoadAttempt, ...LoadAttempt[]] => [
	attempt(first),
	...rest.map((cause) => attempt(cause)),
];

describe('promoteTerminal', () => {
	describe('one — a single attempt maps to its terminal cause', () => {
		it('a lone fetch-failed promotes to fetch-failed', () => {
			expect(promoteTerminal(ledger('fetch-failed'))).toBe('fetch-failed');
		});

		it('a lone storage-quota promotes to storage-quota', () => {
			expect(promoteTerminal(ledger('storage-quota'))).toBe('storage-quota');
		});

		it('a lone cache-evicted promotes to cache-evicted', () => {
			expect(promoteTerminal(ledger('cache-evicted'))).toBe('cache-evicted');
		});

		it('a lone device-lost is never terminal — it folds to all-candidates-exhausted', () => {
			expect(promoteTerminal(ledger('device-lost'))).toBe(
				'all-candidates-exhausted',
			);
		});

		it('a lone unknown folds to all-candidates-exhausted', () => {
			expect(promoteTerminal(ledger('unknown'))).toBe(
				'all-candidates-exhausted',
			);
		});
	});

	describe('many — storage-quota wins by precedence (any, position-independent)', () => {
		it('wins from a non-head slot over fetch-failed', () => {
			expect(promoteTerminal(ledger('fetch-failed', 'storage-quota'))).toBe(
				'storage-quota',
			);
		});

		it('wins from the head slot over fetch-failed', () => {
			expect(promoteTerminal(ledger('storage-quota', 'fetch-failed'))).toBe(
				'storage-quota',
			);
		});

		it('outranks cache-evicted', () => {
			expect(promoteTerminal(ledger('cache-evicted', 'storage-quota'))).toBe(
				'storage-quota',
			);
		});

		it('is not blocked by a diagnostic cause', () => {
			expect(promoteTerminal(ledger('storage-quota', 'unknown'))).toBe(
				'storage-quota',
			);
		});
	});

	describe('many — cache-evicted wins by precedence when no storage-quota', () => {
		it('beats fetch-failed', () => {
			expect(promoteTerminal(ledger('fetch-failed', 'cache-evicted'))).toBe(
				'cache-evicted',
			);
		});

		it('is not blocked by a diagnostic cause', () => {
			expect(promoteTerminal(ledger('cache-evicted', 'device-lost'))).toBe(
				'cache-evicted',
			);
		});
	});

	describe('many — fetch-failed promotes only when ALL attempts are fetch-failed', () => {
		it('a uniform fetch-failed ledger promotes to fetch-failed', () => {
			expect(promoteTerminal(ledger('fetch-failed', 'fetch-failed'))).toBe(
				'fetch-failed',
			);
		});

		it('one device-lost among fetch-failed blocks the fold', () => {
			expect(promoteTerminal(ledger('fetch-failed', 'device-lost'))).toBe(
				'all-candidates-exhausted',
			);
		});

		it('one unknown among fetch-failed blocks the fold', () => {
			expect(promoteTerminal(ledger('fetch-failed', 'unknown'))).toBe(
				'all-candidates-exhausted',
			);
		});

		it('the fold is strict — a single non-fetch-failed among many blocks it', () => {
			expect(
				promoteTerminal(
					ledger('fetch-failed', 'fetch-failed', 'device-lost'),
				),
			).toBe('all-candidates-exhausted');
		});
	});
});
