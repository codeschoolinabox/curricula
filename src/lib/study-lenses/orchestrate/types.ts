/**
 * The orchestrator's contract: the package's public host surface, plus the
 * region-internal fit-mark vocabulary the level surfaces share. Everything
 * else in this region is internal.
 *
 * Region docs: ./README.md (host surface + mechanics) · ./DOCS.md
 * (architecture). The package glossary (../README.md) owns the shared
 * vocabulary.
 */

import type { SnippetType } from '../embody/types.js';
import type { LanguageLevel } from '../language-levels/types.js';
import type { Lens, LensConfig } from '../lenses/types.js';

// ─────────────────────────────────────────────────────────────────────────────
// The host surface
// ─────────────────────────────────────────────────────────────────────────────

/**
 * What the embedding site provides to the one component it mounts. Only
 * `snippet` is required, and every initial choice is a default, never a
 * lock: the learner can override level, posture, snippet type, lens choice,
 * and configuration for their session.
 */
export type StudyLensesProperties = {
	/**
	 * The program source. This prop is the source text alone — the
	 * glossary's snippet is this prop together with `type`.
	 */
	readonly snippet: string;
	/**
	 * The initial snippet type; the learner's toggle overrides it. Defaults
	 * to `'module'`, resolved once at the top component — every consumer
	 * downstream receives a concrete type, never an absent one.
	 */
	readonly type?: SnippetType;
	/**
	 * An initial-focus request naming a lens — honored, never obeyed: a
	 * phase-declaring lens when its phase is accessible, a panel-excluded
	 * lens after its applicability runs at mount; otherwise normal
	 * rendering. Never a bypass — the enforcement mask applies to a
	 * focus-mounted lens identically. Naming the run lens is the run-first
	 * posture for curated examples.
	 */
	readonly lens?: string;
	/**
	 * The configuration cascade's top layer: overrides keyed by lens name.
	 * Whatever the embedding site composes upstream arrives already folded
	 * in here; the learner's session tweaks stay the final layer.
	 */
	readonly configs?: Readonly<Record<string, Partial<LensConfig>>>;
	/** Injected lenses — append-only; a lens-name collision fails loudly. */
	readonly lenses?: ReadonlyArray<Lens>;
	/**
	 * Injected language levels — append-only; a key collision fails loudly,
	 * and the empty key stays reserved for the none-state.
	 */
	readonly languageLevels?: ReadonlyArray<LanguageLevel>;
	/** The initially selected level's key; `''` selects the none-state. */
	readonly activeLanguageLevel?: string;
	/** The initial enforcement posture; warn — `false` — is the default. */
	readonly strictLanguageLevels?: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// The selector's fit marks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The four-valued mark vocabulary a level's assessment carries — derived
 * once per settle and per level in this region's marking library, from the
 * level's verdict, its admitted snippet types, and the current type (the
 * verdict itself encodes the parse status). Region-internal shared
 * vocabulary — the selector renders every level's mark and the mask
 * projects the selected assessment; it is not part of the host surface.
 *
 * @remarks
 * While the code does not parse the mark is `undetermined`, and that
 * verdict wins regardless of type admission — a typo never reads as a level
 * violation, and the parse phases' supports stay available.
 */
export type FitMark =
	| 'fits'
	| 'does-not-fit'
	| 'not-applicable-for-type'
	| 'undetermined';
