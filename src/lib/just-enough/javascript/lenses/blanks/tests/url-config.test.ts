import { describe, expect, it, vi } from 'vitest';

import urlConfig from '../lib/url-config.js';
import type { GlobalScope } from '../lib/url-config.js';

function makeStubScope(initialHash = ''): GlobalScope & {
	listeners: Array<() => void>;
} {
	let hash = initialHash;
	const listeners: Array<() => void> = [];
	return {
		location: {
			get hash(): string {
				return hash;
			},
			set hash(next: string) {
				hash = next;
			},
		},
		history: {
			replaceState(_state, _title, url) {
				const index = url.indexOf('#');
				hash = index === -1 ? '' : url.slice(index);
			},
		},
		addEventListener(_type, listener) {
			listeners.push(listener);
		},
		removeEventListener(_type, listener) {
			const index = listeners.indexOf(listener);
			if (index !== -1) listeners.splice(index, 1);
		},
		listeners,
	};
}

describe('parseHash — pure', () => {
	describe('Zero — empty inputs', () => {
		it('returns empty config for empty hash', () => {
			expect(urlConfig.parseHash('')).toEqual({});
		});

		it('returns empty config for hash with no blanks parameter', () => {
			expect(urlConfig.parseHash('#foo=bar')).toEqual({});
		});

		it('returns empty config when blanks parameter has empty value', () => {
			expect(urlConfig.parseHash('#?blanks=')).toEqual({});
		});
	});

	describe('One — single field per hash', () => {
		it('extracts difficulty as number', () => {
			expect(urlConfig.parseHash('#?blanks=difficulty:75')).toEqual({
				difficulty: 75,
			});
		});

		it('extracts viewMode', () => {
			expect(urlConfig.parseHash('#?blanks=view:complete')).toEqual({
				viewMode: 'complete',
			});
		});

		it('extracts hintsMode', () => {
			expect(urlConfig.parseHash('#?blanks=hints:on')).toEqual({
				hintsMode: 'on',
			});
			expect(urlConfig.parseHash('#?blanks=hints:off')).toEqual({
				hintsMode: 'off',
			});
		});

		// AR-3 BLOCKER Inc 6h-redux: editorMode round-trip lock —
		// without this, dropping the `editor:` key from serializeConfig
		// or removing it from parseHash would silently break URL
		// persistence with no test signal.
		it('extracts editorMode', () => {
			expect(urlConfig.parseHash('#?blanks=editor:helpful')).toEqual({
				editorMode: 'helpful',
			});
			expect(urlConfig.parseHash('#?blanks=editor:diff')).toEqual({
				editorMode: 'diff',
			});
			expect(urlConfig.parseHash('#?blanks=editor:raw')).toEqual({
				editorMode: 'raw',
			});
		});

		it('ignores unknown editorMode', () => {
			expect(urlConfig.parseHash('#?blanks=editor:bogus')).toEqual({});
		});

		it('extracts contentTypes as array', () => {
			expect(
				urlConfig.parseHash('#?blanks=types:keywords+identifiers'),
			).toEqual({ contentTypes: ['keywords', 'identifiers'] });
		});
	});

	describe('Many — multiple fields combined', () => {
		it('extracts all four fields from a fully-populated hash', () => {
			const result = urlConfig.parseHash(
				'#?blanks=difficulty:50,types:keywords+identifiers,view:blankenated,hints:on',
			);
			expect(result).toEqual({
				difficulty: 50,
				contentTypes: ['keywords', 'identifiers'],
				viewMode: 'blankenated',
				hintsMode: 'on',
			});
		});
	});

	describe('Boundaries — value validation', () => {
		it('ignores out-of-range difficulty', () => {
			expect(urlConfig.parseHash('#?blanks=difficulty:-5')).toEqual({});
		});

		it('ignores difficulty above 100', () => {
			expect(urlConfig.parseHash('#?blanks=difficulty:101')).toEqual({});
		});

		it('accepts difficulty at 0 boundary', () => {
			expect(urlConfig.parseHash('#?blanks=difficulty:0')).toEqual({
				difficulty: 0,
			});
		});

		it('accepts difficulty at 100 boundary', () => {
			expect(urlConfig.parseHash('#?blanks=difficulty:100')).toEqual({
				difficulty: 100,
			});
		});

		it('ignores unknown viewMode', () => {
			expect(urlConfig.parseHash('#?blanks=view:bogus')).toEqual({});
		});

		it('ignores unknown hintsMode', () => {
			expect(urlConfig.parseHash('#?blanks=hints:bogus')).toEqual({});
			expect(urlConfig.parseHash('#?blanks=hints:auto')).toEqual({});
			expect(urlConfig.parseHash('#?blanks=hints:easy')).toEqual({});
		});

		it('filters unknown content type names', () => {
			expect(
				urlConfig.parseHash('#?blanks=types:keywords+bogus+literals'),
			).toEqual({ contentTypes: ['keywords', 'literals'] });
		});
	});

	describe('Exceptions — malformed input', () => {
		it('returns empty config for non-numeric difficulty', () => {
			expect(urlConfig.parseHash('#?blanks=difficulty:abc')).toEqual({});
		});

		it('returns empty config when types is empty after filtering', () => {
			expect(urlConfig.parseHash('#?blanks=types:bogus')).toEqual({});
		});

		it('requires the ? prefix — bare #blanks= returns empty config', () => {
			// Lock the contract: parser ONLY accepts `#?blanks=...` (the
			// query form). `#blanks=...` (no ? separator) is unsupported.
			expect(urlConfig.parseHash('#blanks=difficulty:50')).toEqual({});
		});
	});
});

describe('serializeConfig — pure', () => {
	describe('One — single field per call (triangulation)', () => {
		it('serializes difficulty alone', () => {
			expect(urlConfig.serializeConfig({ difficulty: 0 })).toBe('difficulty:0');
		});

		it('serializes contentTypes alone (join with +)', () => {
			expect(urlConfig.serializeConfig({ contentTypes: ['literals'] })).toBe(
				'types:literals',
			);
		});

		it('serializes viewMode alone', () => {
			expect(urlConfig.serializeConfig({ viewMode: 'complete' })).toBe(
				'view:complete',
			);
		});

		it('serializes hintsMode alone', () => {
			expect(urlConfig.serializeConfig({ hintsMode: 'on' })).toBe('hints:on');
			expect(urlConfig.serializeConfig({ hintsMode: 'off' })).toBe('hints:off');
		});

		it('serializes editorMode alone', () => {
			expect(urlConfig.serializeConfig({ editorMode: 'helpful' })).toBe(
				'editor:helpful',
			);
			expect(urlConfig.serializeConfig({ editorMode: 'diff' })).toBe(
				'editor:diff',
			);
			expect(urlConfig.serializeConfig({ editorMode: 'raw' })).toBe(
				'editor:raw',
			);
		});

		it('round-trips editorMode through serialize/parse', () => {
			const config = { editorMode: 'diff' as const };
			const serialized = urlConfig.serializeConfig(config);
			const parsed = urlConfig.parseHash(`#?blanks=${serialized}`);
			expect(parsed).toEqual(config);
		});

		it('round-trips a fully-populated config including editorMode', () => {
			const config = {
				difficulty: 50,
				contentTypes: ['keywords'] as ReadonlyArray<'keywords'>,
				viewMode: 'blankenated' as const,
				editorMode: 'raw' as const,
				hintsMode: 'off' as const,
			};
			const serialized = urlConfig.serializeConfig(config);
			const parsed = urlConfig.parseHash(`#?blanks=${serialized}`);
			expect(parsed).toEqual(config);
		});
	});

	it('serializes a fully-populated config', () => {
		expect(
			urlConfig.serializeConfig({
				difficulty: 50,
				contentTypes: ['keywords', 'identifiers'],
				viewMode: 'blankenated',
				hintsMode: 'on',
			}),
		).toBe(
			'difficulty:50,types:keywords+identifiers,view:blankenated,hints:on',
		);
	});

	it('serializes a partial config (only some fields)', () => {
		expect(
			urlConfig.serializeConfig({
				difficulty: 75,
				viewMode: 'complete',
			}),
		).toBe('difficulty:75,view:complete');
	});

	it('round-trips through parseHash', () => {
		const config = {
			difficulty: 33,
			contentTypes: ['operators'] as ReadonlyArray<'operators'>,
			viewMode: 'blankenated' as const,
			hintsMode: 'off' as const,
		};
		const serialized = urlConfig.serializeConfig(config);
		const parsed = urlConfig.parseHash(`#?blanks=${serialized}`);
		expect(parsed).toEqual(config);
	});

	// AR-4 BLOCKER fix (Inc 6.6 expansion): the `delimiters` content
	// type was added to BlankType/ContentType + DELIMITER_LABELS +
	// core.ts defaults, but `VALID_CONTENT_TYPES` in url-config.ts was
	// missed in the original rename — silently dropping `delimiters`
	// from any URL-persisted config. This round-trip test locks the
	// fix and prevents regression: serialize a config containing
	// `delimiters`, parse it back, assert the array is preserved.
	it('round-trips `delimiters` content type through serialize/parse', () => {
		const config = {
			difficulty: 50,
			contentTypes: ['delimiters'] as ReadonlyArray<'delimiters'>,
			viewMode: 'blankenated' as const,
			hintsMode: 'on' as const,
		};
		const serialized = urlConfig.serializeConfig(config);
		const parsed = urlConfig.parseHash(`#?blanks=${serialized}`);
		expect(parsed).toEqual(config);
	});

	it('round-trips all five content types through serialize/parse', () => {
		const config = {
			contentTypes: [
				'keywords',
				'identifiers',
				'operators',
				'literals',
				'delimiters',
			] as ReadonlyArray<
				'keywords' | 'identifiers' | 'operators' | 'literals' | 'delimiters'
			>,
		};
		const serialized = urlConfig.serializeConfig(config);
		const parsed = urlConfig.parseHash(`#?blanks=${serialized}`);
		expect(parsed).toEqual(config);
	});

	it('returns empty string for empty config', () => {
		expect(urlConfig.serializeConfig({})).toBe('');
	});
});

describe('read — side-effecting', () => {
	it('reads from globalScope.location.hash', () => {
		const scope = makeStubScope('#?blanks=difficulty:25');
		expect(urlConfig.read(scope)).toEqual({ difficulty: 25 });
	});

	it('returns empty config when hash is empty', () => {
		const scope = makeStubScope('');
		expect(urlConfig.read(scope)).toEqual({});
	});
});

describe('write — side-effecting', () => {
	it('writes serialized config to the hash via history.replaceState', () => {
		const scope = makeStubScope('');
		const replaceSpy = vi.spyOn(scope.history, 'replaceState');
		urlConfig.write({ difficulty: 50, hintsMode: 'on' }, scope);
		expect(replaceSpy).toHaveBeenCalledTimes(1);
		const url = replaceSpy.mock.calls[0][2];
		// Lock the URL format: must start with #?blanks= (the query form).
		expect(url).toMatch(/^#\?blanks=/);
		expect(url).toContain('difficulty:50');
		expect(url).toContain('hints:on');
	});

	it('produces a hash that round-trips back through read', () => {
		const scope = makeStubScope('');
		urlConfig.write({ difficulty: 75, contentTypes: ['identifiers'] }, scope);
		expect(urlConfig.read(scope)).toEqual({
			difficulty: 75,
			contentTypes: ['identifiers'],
		});
	});
});

describe('subscribe — hashchange', () => {
	it('invokes the callback when a hashchange event fires', () => {
		const scope = makeStubScope('');
		const callback = vi.fn();
		urlConfig.subscribe(callback, scope);
		expect(scope.listeners.length).toBe(1);
		scope.listeners[0]();
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('returns an unsubscribe function that removes the listener', () => {
		const scope = makeStubScope('');
		const callback = vi.fn();
		const unsubscribe = urlConfig.subscribe(callback, scope);
		expect(scope.listeners.length).toBe(1);
		unsubscribe();
		expect(scope.listeners.length).toBe(0);
	});
});
