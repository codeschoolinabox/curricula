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
 * Panel-rendering follows the `Snippet` staircase from
 * `../../embody/types.ts § Snippet` — each panel guards on the appropriate
 * `embodiment.status.*` boolean (or on a null check for a nullable field)
 * before reading dependent data. The status panel shows the four
 * `Status` booleans (`tokenized, parsed, validated, created`) plus the
 * first-fail kind (`embodiment.errors?.kind ?? null`). The validation
 * panel renders fields when `embodiment.validation !== null`
 * (validate-fail leaf and beyond) and renders the gate-phrased
 * `VALIDATION_ABSENT_PLACEHOLDER` otherwise (tokenize-fail and parse-fail
 * leaves). See `./DOCS.md` § Handling absent fields for the staircase
 * consumer convention.
 *
 * @remarks Per the lenses peer's invariant, takes `embodiment` as the
 * parameter name (not `props.embodiment`). Reads only the public
 * `Snippet` shape (`source`, `status`, `validation`, `errors`) — no
 * branching on sentinel literals in `embodiment.source.code` (see
 * `./README.md` § Conventions inherited).
 */

import type { Snippet } from '../../embody/types.js';
import type { LensConfig } from '../types.js';

import type { DisplayTree, Panel } from './types.js';

export default function deriveDisplayTree(
	embodiment: Snippet,
	config?: LensConfig,
): DisplayTree {
	const panels: readonly Panel[] = [
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
					validated: embodiment.status.validated,
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
			// `Snippet.validation` is nullable — null at tokenize-fail and
			// parse-fail leaves per the embody staircase (see
			// `../../embody/types.ts § Snippet`). Guard via null check rather
			// than a status-boolean read; the equivalence is structural
			// (validate-fail-and-beyond ⇔ validation !== null) and the null
			// check narrows the type at the deref sites below.
			content:
				embodiment.validation === null
					? VALIDATION_ABSENT_PLACEHOLDER
					: JSON.stringify(
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

/**
 * Emitted by the validation panel when `embodiment.validation` is absent
 * (tokenize-fail and parse-fail leaves per the embody staircase). The
 * placeholder phrases the gate condition, not a counterfactual about what
 * happened, so it reads correctly for both fail-leaves regardless of which
 * gate actually failed. Mirrors the literal in
 * `./tests/core.test.ts § VALIDATION_ABSENT_PLACEHOLDER` and the prose
 * in `./README.md § Panel contract` + `./DOCS.md § Display derivation`.
 */
const VALIDATION_ABSENT_PLACEHOLDER =
	'(validation absent — gated on parse success)';
