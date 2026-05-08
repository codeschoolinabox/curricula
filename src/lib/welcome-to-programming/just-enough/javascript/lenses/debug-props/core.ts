/**
 * @file Pure-TS display derivation for the `debug-props` meta-lens.
 *
 * Maps `LensProps` → `DisplayTree`. Receives the orchestrator-supplied
 * `embodiment` (frozen `Snippet`) and optional `config` (resolved
 * `LensConfig`), and returns a serialisable record of panels to render.
 * No React imports — testable in vitest without `jsdom`.
 *
 * The four panels (`snippet`, `status`, `validation`, `config`) are
 * load-bearing: their `key` strings round-trip into the React wrapper's
 * `data-debug-panel="<key>"` attribute. Sandbox-harness selectors target
 * panels by key; renaming or removing a panel is a contract change.
 *
 * @remarks Per the lenses peer's invariant, takes `embodiment` as the
 * parameter name (not `props.embodiment`). Reads only the public
 * `Snippet` shape (`source`, `status`, `validation`, `errors`) — no
 * branching on sentinel literals in `embodiment.source.code` (see
 * `../README.md` § Conventions).
 */

import type { Snippet } from '../../embody/types.js';

import type { LensConfig } from '../types.js';

import type { DisplayTree, Panel } from './types.js';

function deriveDisplayTree(
	embodiment: Snippet,
	config?: LensConfig,
): DisplayTree {
	const panels: Panel[] = [
		{
			key: 'snippet',
			label: 'snippet (source code)',
			content: embodiment.source.code,
		},
		{
			key: 'status',
			label: 'status (embody pipeline)',
			content: JSON.stringify(
				{
					tokenized: embodiment.status.tokenized,
					parsed: embodiment.status.parsed,
					created: embodiment.status.created,
					errors: embodiment.errors === null ? null : embodiment.errors.kind,
				},
				null,
				2,
			),
		},
		{
			key: 'validation',
			label: 'validation (JeJ + determinism + IO)',
			content: JSON.stringify(
				{
					formatted: embodiment.validation.formatted,
					isJeJ: embodiment.validation.isJeJ,
					isDeterministic: embodiment.validation.isDeterministic,
					doesPause: embodiment.validation.doesPause,
					violationCount: embodiment.validation.violations.length,
				},
				null,
				2,
			),
		},
		{
			key: 'config',
			label: 'config (resolved per-lens config)',
			content:
				config === undefined || Object.keys(config).length === 0
					? '(empty)'
					: JSON.stringify(config, null, 2),
		},
	];
	return Object.freeze({ panels: Object.freeze(panels) });
}

export default deriveDisplayTree;
