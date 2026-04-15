/**
 * @file Types for the study lens component.
 *
 * @remarks The study lens is the default meta-lens (editor + action
 * buttons). These types express its public surface: the per-lens options
 * bag that `<StudyLens>` narrows from the plugin-injected `config` prop,
 * and the three action-button identifiers used by V1.
 *
 * Domain vocabulary (from the plan's ubiquitous-language glossary):
 * "options" is the typed, narrowed per-lens configuration — distinct
 * from the plugin-side "config" bag that arrives untyped.
 *
 * @module components/lenses/study/types
 */

import type { EngineConfig } from '../../../lib/evaluating/shared/types.js';

/**
 * Identifiers for the action buttons the study lens can render.
 *
 * @remarks V1 ships three buttons: Run, Format, Reset. Trace, Debug,
 * Table, and Ask land in follow-on plans and add entries here.
 */
type StudyButton = 'run' | 'format' | 'reset';

/**
 * Per-lens options for the study lens, narrowed from the plugin's
 * `config` prop by `study-lens.tsx` at render time.
 *
 * @remarks All fields optional. Defaults applied inline during narrowing:
 *
 * - `buttons` defaults to all three.
 * - `engine` defaults to `{ seconds: 5 }`. `iterations` is left undefined
 *   so `api/run` applies its own default.
 *
 * `engine` is typed as the runner's own `EngineConfig` so the lens does
 * not re-invent the runner's parameter bag; if `EngineConfig` gains
 * fields (e.g. a future `budget`), the lens surface picks them up
 * automatically.
 */
type StudyOptions = {
	readonly buttons?: ReadonlyArray<StudyButton>;
	readonly engine?: EngineConfig;
};

// ─── Exports ────────────────────────────────────────────────

export type { StudyButton, StudyOptions };
