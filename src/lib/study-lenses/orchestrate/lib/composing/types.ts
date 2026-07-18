/**
 * The composition library's contracts: the session-fixed joined rosters and
 * the configuration cascade's layers.
 *
 * Library docs: ./README.md (mechanics) · ./DOCS.md (architecture). The
 * region glossary (../../README.md) owns the shared vocabulary.
 */

import type { LanguageLevel } from '../../../language-levels/types.js';
import type { Lens, LensConfig } from '../../../lenses/types.js';

// ─────────────────────────────────────────────────────────────────────────────
// The joined rosters
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The mount-time lens join's result: built-ins plus injections, append-only,
 * session-fixed. A lens-name collision throws at the join, naming the lens.
 * Structure is frozen; the lens refs stay owned by their defining modules.
 */
export type JoinedLensRoster = ReadonlyArray<Lens>;

/**
 * The mount-time level join's result: built-ins plus injections, append-only,
 * session-fixed. A key collision throws at the join, and the empty key `''`
 * stays reserved for the none-state — injecting it throws too.
 */
export type JoinedLevelRoster = ReadonlyArray<LanguageLevel>;

// ─────────────────────────────────────────────────────────────────────────────
// The cascade
// ─────────────────────────────────────────────────────────────────────────────

/** One override layer of the cascade: overrides keyed by lens name. */
export type ConfigOverridesByLens = Readonly<
	Record<string, Partial<LensConfig>>
>;

/**
 * The cascade's three ordered override layers, weakest first: the host's
 * `configs` prop; the opening overrides of a recommendation-opened lens;
 * the learner's session tweaks — always final. Every layer is present, an
 * empty record when it has nothing to say. Resolution runs per lens name,
 * through the lens's own `config` factory when it declares one, else the
 * shared deep-merge; an override key valued `undefined` is absent, `null`
 * is a value.
 */
export type ConfigCascade = {
	readonly host: ConfigOverridesByLens;
	readonly opened: ConfigOverridesByLens;
	readonly learner: ConfigOverridesByLens;
};
