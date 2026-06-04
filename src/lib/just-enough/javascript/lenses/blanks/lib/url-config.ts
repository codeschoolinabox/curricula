/**
 * @file VENDORED & SLIMMED — adapted from the legacy 296-line
 * `src/utils/urlManager.js`. Only the read/write surface for the
 * single `?blanks=...` URL parameter is preserved; multi-lens cascade,
 * file-path management, code-share-via-base64, pseudocode toggles,
 * and colorize toggles (which were properly orchestrator-domain) are
 * dropped.
 *
 * URL format (matches legacy):
 * `?blanks=difficulty:N,types:a+b,view:X,hints:Y`
 *
 * Field order in `serializeConfig` is the canonical order
 * `difficulty, types, view, hints` — semantic round-trip
 * (`parseHash(`#?${serializeConfig(parseHash(hash))}`) === parseHash(hash)`)
 * is the contract, not byte-for-byte string equality with a
 * non-canonical input.
 *
 * Storage surface: `window.location.hash`. The legacy used hash-based
 * routing (`#filepath?params`); v1 uses a slimmed `#?blanks=...` form
 * so the blanks-preview page (`/blanks-preview`) and the L1-picker
 * page (`/spiralearn/l1-picker`) can each carry the lens's
 * cross-mount config. **The `?` separator is mandatory** —
 * `#blanks=...` (no `?`) returns empty config.
 *
 * API surface:
 * - `parseHash(hash)`: pure — extracts a `Partial<BlanksLensConfig>`.
 * - `serializeConfig(config)`: pure — produces the `blanks=...` value
 *   string (NOT the full hash; just the value of the `blanks` param).
 * - `read()`: reads `window.location.hash` and returns parsed config.
 * - `write(config)`: writes the config to `window.location.hash` via
 *   `history.replaceState`. **Does NOT fire `hashchange`** (per Web
 *   spec — `replaceState` is silent); callers do NOT receive their own
 *   write through `subscribe`.
 * - `subscribe(callback)`: registers a `hashchange` listener; returns
 *   an unsubscribe function. The callback receives no arguments — the
 *   wrapper is expected to call `read()` itself inside the callback to
 *   get the current parsed config.
 *
 * The pure functions are testable without jsdom; the side-effecting
 * ones take an optional `globalScope` parameter for test stubbing.
 *
 * Vendoring posture: lib eslint-ignored.
 */

import type {
	BlanksLensConfig,
	ContentType,
	HintsLevel,
	ViewMode,
} from '../types.js';

type GlobalScope = {
	readonly location: { hash: string };
	readonly history: {
		replaceState: (state: unknown, title: string, url: string) => void;
	};
	readonly addEventListener: (type: 'hashchange', listener: () => void) => void;
	readonly removeEventListener: (
		type: 'hashchange',
		listener: () => void,
	) => void;
};

const VALID_CONTENT_TYPES: ReadonlySet<ContentType> = new Set([
	'keywords',
	'identifiers',
	'operators',
	'literals',
]);
const VALID_VIEW_MODES: ReadonlySet<ViewMode> = new Set([
	'blankenated',
	'complete',
]);
const VALID_HINTS_LEVELS: ReadonlySet<HintsLevel> = new Set([
	'auto',
	'easy',
	'medium',
	'hard',
]);

function getBlanksParamValue(hash: string): string | null {
	// Format: `#?blanks=...&other=...` — the `?` separator is mandatory.
	// `#blanks=...` (no `?`) is not supported and returns null.
	//
	// We parse the value manually rather than via `URLSearchParams`
	// because URLSearchParams decodes `+` to space (per the
	// application/x-www-form-urlencoded standard), but the legacy URL
	// format uses literal `+` as a value separator in
	// `types:keywords+identifiers`. Manual scanning preserves `+`
	// verbatim. (For learner-facing URL readability the legacy chose
	// `+` over `%2B`; v1 keeps that choice.)
	if (!hash.startsWith('#?')) return null;
	const queryString = hash.slice(2);
	const match = queryString.match(/(?:^|&)blanks=([^&]*)/);
	return match ? (match[1] ?? null) : null;
}

function parseHash(hash: string): Partial<BlanksLensConfig> {
	const blanksValue = getBlanksParamValue(hash);
	if (blanksValue === null || blanksValue === '') return {};

	const config: {
		difficulty?: number;
		contentTypes?: ReadonlyArray<ContentType>;
		viewMode?: ViewMode;
		hintsLevel?: HintsLevel;
	} = {};

	for (const segment of blanksValue.split(',')) {
		const [key, value] = segment.split(':');
		if (!key || value === undefined) continue;
		if (key === 'difficulty') {
			const n = Number(value);
			if (Number.isFinite(n) && n >= 0 && n <= 100) {
				config.difficulty = n;
			}
		} else if (key === 'types') {
			const types = value
				.split('+')
				.filter((t): t is ContentType =>
					VALID_CONTENT_TYPES.has(t as ContentType),
				);
			if (types.length > 0) {
				config.contentTypes = types;
			}
		} else if (key === 'view') {
			if (VALID_VIEW_MODES.has(value as ViewMode)) {
				config.viewMode = value as ViewMode;
			}
		} else if (key === 'hints') {
			if (VALID_HINTS_LEVELS.has(value as HintsLevel)) {
				config.hintsLevel = value as HintsLevel;
			}
		}
	}

	return config;
}

function serializeConfig(config: Partial<BlanksLensConfig>): string {
	const parts: string[] = [];
	// Canonical field order: difficulty, types, view, hints.
	if (config.difficulty !== undefined) {
		parts.push(`difficulty:${config.difficulty}`);
	}
	if (config.contentTypes !== undefined && config.contentTypes.length > 0) {
		parts.push(`types:${config.contentTypes.join('+')}`);
	}
	if (config.viewMode !== undefined) {
		parts.push(`view:${config.viewMode}`);
	}
	if (config.hintsLevel !== undefined) {
		parts.push(`hints:${config.hintsLevel}`);
	}
	return parts.join(',');
}

function getScope(scope?: GlobalScope): GlobalScope {
	if (scope) return scope;
	// Default to the browser globals. Throws at first non-test call if
	// the browser environment is unavailable (which is correct — the
	// lens lives in the browser).
	return globalThis as unknown as GlobalScope;
}

function read(globalScope?: GlobalScope): Partial<BlanksLensConfig> {
	const scope = getScope(globalScope);
	return parseHash(scope.location.hash);
}

function write(
	config: Partial<BlanksLensConfig>,
	globalScope?: GlobalScope,
): void {
	const scope = getScope(globalScope);
	const value = serializeConfig(config);
	const newHash = value === '' ? '' : `#?blanks=${value}`;
	scope.history.replaceState({}, '', newHash);
}

function subscribe(
	callback: () => void,
	globalScope?: GlobalScope,
): () => void {
	const scope = getScope(globalScope);
	scope.addEventListener('hashchange', callback);
	return function unsubscribe(): void {
		scope.removeEventListener('hashchange', callback);
	};
}

const urlConfig = {
	parseHash,
	serializeConfig,
	read,
	write,
	subscribe,
};

export type { GlobalScope };
export default urlConfig;
