/**
 * @file Shared grid types of the questioning parent — the BLOCK-model
 * vocabulary both question engines tag their items with. Documentation truth
 * lives in ./README.md (the grid, the registers, the glossary); this file is
 * its type expression. Zero imports, zero runtime exports: the parent
 * compiles away entirely.
 */

/**
 * The three dimensions of the BLOCK model (Schulte 2008).
 *
 * - `text-surface`: the written code — syntax, layout, naming
 * - `execution`: what happens at runtime — data flow, state
 * - `purpose`: why the code exists — intent, design rationale
 */
export type BlockDimension = 'text-surface' | 'execution' | 'purpose';

/**
 * The four levels of the BLOCK model.
 *
 * - `atom`: individual language elements (a single statement, operator, or
 *   identifier)
 * - `block`: a coherent group of statements achieving a sub-task
 * - `relation`: connections between blocks (data / control flow)
 * - `macro`: the overall program
 */
export type BlockLevel = 'atom' | 'block' | 'relation' | 'macro';

/** A single cell in the BLOCK model matrix. */
export type BlockCell = {
	readonly dimension: BlockDimension;
	readonly level: BlockLevel;
};

/**
 * The pedagogical level of a question, linearized from the BLOCK model's
 * 12-cell matrix into five named levels matching the curriculum's skill
 * progression. A single question can span multiple levels.
 *
 * - `syntax`: "the code" — text surface at the atom level
 * - `semantics`: "how it works" — execution at atom/block level
 * - `connections`: "relations between parts" — data / control flow
 * - `goals`: "purpose and big picture" — macro-level purpose
 * - `userExperience`: "the user's perspective" — how the program meets the
 *   people who run it, beyond any single grid cell
 *
 * The open register's questions carry this in their `levels` field; closed
 * items carry raw cells only.
 */
export type Level =
	| 'syntax'
	| 'semantics'
	| 'connections'
	| 'goals'
	| 'userExperience';
