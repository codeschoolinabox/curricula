import { describe, expect, it } from 'vitest';

// @ts-expect-error — untyped vendored legacy JS
import { traceCollector } from '../lib/trace-collector.js';
// @ts-expect-error — untyped vendored legacy JS
import { trace } from '../trace.js';

describe('trace', () => {
	describe('environment-agnostic execution', () => {
		it('does not throw in Node environment', () => {
			traceCollector.reset();

			expect(() => trace('let x = 1;')).not.toThrow();
		});

		it('produces non-empty entries after tracing', () => {
			traceCollector.reset();

			trace('let x = 1;');

			expect(traceCollector.getEntries().length).toBeGreaterThan(0);
		});

		it('entries contain declare operation for variable declaration', () => {
			traceCollector.reset();

			trace('let x = 1;');

			const entries = traceCollector.getEntries();
			const hasDeclaration = entries.some(
				(entry: { logs?: string[] }) =>
					Array.isArray(entry.logs) &&
					entry.logs.some(
						(log: string) =>
							typeof log === 'string' && log.includes('declare'),
					),
			);

			expect(hasDeclaration).toBe(true);
		});
	});
});
