/**
 * The five-phase study panel's contracts. Deliberately import-free: phase
 * names arrive as plain strings, so the panel cannot know the canonical
 * five or mint a phase order — the order has exactly one truth, and it is
 * not here.
 *
 * Surface docs: ./README.md (contract) · ./DOCS.md (architecture). The
 * region glossary (../README.md) owns the shared vocabulary.
 */

/**
 * One phase as the panel renders it. `name` is the phase's data name — the
 * data-attribute identity tests anchor on; `label` is its learner-facing
 * display copy. An accessible phase lists its lens names in render order
 * (empty = present-but-empty); a barred phase carries its cause as display
 * copy in place of a lens list.
 */
export type PhaseEntry =
	| {
			readonly name: string;
			readonly label: string;
			readonly accessible: true;
			readonly lenses: ReadonlyArray<string>;
	  }
	| {
			readonly name: string;
			readonly label: string;
			readonly accessible: false;
			readonly cause: string;
	  };

/** The intent a lens-name affordance raises — mounting is the caller's. */
export type OpenLensIntent = {
	readonly phase: string;
	readonly lens: string;
};

/**
 * What the panel receives. Sections render in exactly the given order —
 * the panel never sorts, never inserts, never knows the canonical five.
 */
export type PhasesPanelProperties = {
	readonly phases: ReadonlyArray<PhaseEntry>;
	readonly onOpenLens: (intent: OpenLensIntent) => void;
};
