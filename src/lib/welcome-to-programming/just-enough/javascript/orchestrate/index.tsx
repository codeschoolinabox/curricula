/**
 * @file `<StudyLenses>` — the package's public API surface.
 *
 * **F1.B scope** (this commit): four-prop component skeleton +
 * mount-time guard for `config` supplied without a resolved-default
 * lens + `embody(snippet)` chain wiring. F1.C mounts the editor home
 * base. When F1 is complete, this file orchestrates the chain
 * `snippet → embody(snippet) → frozen Snippet → mount editor home
 * base`, per the locked decisions in
 * [`./README.md` § Public API](./README.md) and the F1 narrowing
 * block in the same file:
 *
 * - **Four-prop signature is the public contract.** Accepts
 *   `{ snippet, lens?, config?, configs? }`. Every prop typechecks;
 *   only `snippet` is wired to runtime in F1.
 * - **`lens?` / `config?` / `configs?` are no-ops in F1**, except for
 *   the F1 mount-time guard: if `config` is supplied AND `lens` is
 *   unset AND `configs?.default` is unset, throw at mount with a clear
 *   message (per WS3 handoff line 54). The cascade resolution chain
 *   (tier-0 lens defaults ⊕ tier-1 cascade ⊕ tier-2 per-fence
 *   override) lands in L2 alongside the picker / panel.
 * - **No format pre-processing.** The chain is `snippet → embody`
 *   directly. `embody` validates format compliance via
 *   `Snippet.validation.formatted` and surfaces JEJ-subset
 *   violations via `Snippet.validation.violations`; the orchestrator
 *   does not pre-format.
 * - **No mode discriminator yet.** F1 has no editor-vs-lens state
 *   machine; F1.C will mount the editor unconditionally. F2
 *   introduces the 2-mode discriminator per `./types.ts` §
 *   `OrchestratorState`.
 * - **Internal-only EventBus.** F1 fires no events; F5 wires the
 *   internal bus.
 *
 * @remarks F1.B scope: the embody chain is wired but the resulting
 * `Snippet` is held in a `useMemo` slot without a downstream consumer
 * — F1.C will mount the editor home base, but the editor never
 * receives the embodiment as a prop (per AR-1 CP-1; the editor is
 * editor-mode-only and embodiment is a lens-mode concept introduced
 * in F2). The F1.B smoke goal: the chain is alive end-to-end and the
 * memoized embodiment is observable in React DevTools' Hooks panel.
 */

import React from 'react';

import embody from '../embody/index.js';

import type { StudyLensesProps } from './types.js';

export default function StudyLenses({
	snippet,
	lens,
	config,
	configs,
}: StudyLensesProps): React.JSX.Element {
	if (
		config !== undefined &&
		lens === undefined &&
		configs?.default === undefined
	) {
		throw new Error(
			'<StudyLenses>: `config` requires a resolved default lens. Set `lens={…}` or `configs.default={…}` (or omit `config`).',
		);
	}
	// Embody chain (F1.B). Memoized on snippet — a fresh Snippet is
	// derived synchronously on every snippet change, per
	// `./DOCS.md` § F1 narrowing of the effect-topology table.
	// Note: this trigger condition (every snippet change) is the
	// broadened F1 approximation; F2 narrows it to the mode → lens
	// transition once the discriminator lands.
	// Held but not yet consumed: F1's smoke goal per AR-1 is that the
	// chain is alive end-to-end and the embodiment is observable in
	// React DevTools' Hooks panel; future increments add consumers.
	// eslint-disable-next-line sonarjs/no-unused-vars -- intentional smoke-test scaffolding (AR-1 concern 4)
	const _embodiment = React.useMemo(() => embody(snippet), [snippet]);
	return <div data-orchestrator-root />;
}

export type { StudyLensesProps } from './types.js';
