/**
 * @file `<StudyLenses>` — the package's public API surface.
 *
 * **F1.A scope** (this commit): four-prop component skeleton +
 * mount-time guard for `config` supplied without a resolved-default
 * lens. F1.B wires the `snippet → embody(snippet) → Snippet` pipeline;
 * F1.C mounts the editor home base. When F1 is complete, this file
 * orchestrates the chain `snippet → embody(snippet) → frozen Snippet
 * → mount editor home base`, per the locked decisions in
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
 *   machine; the editor is mounted unconditionally. F2 introduces
 *   the 2-mode discriminator per `./types.ts` § `OrchestratorState`.
 * - **Internal-only EventBus.** F1 fires no events; F5 wires the
 *   internal bus.
 *
 * @remarks F1.A scope: this file ships the four-prop component
 * skeleton. F1.B adds the embody pipeline; F1.C wires the editor
 * home base. The F1.A skeleton renders a `<div
 * data-orchestrator-root>` placeholder with no children.
 */

import React from 'react';

import type { StudyLensesProps } from './types.js';

export default function StudyLenses({
	// snippet is destructured now so F1.B wires embody(snippet) with no
	// diff to the destructuring shape. Unused at runtime in F1.A.
	snippet: _snippet,
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
	return <div data-orchestrator-root />;
}

export type { StudyLensesProps } from './types.js';
