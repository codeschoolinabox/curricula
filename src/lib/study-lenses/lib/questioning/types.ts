// cspell:ignore Schulte omittable bivariant

/**
 * @file Shared types of the questioning parent — the BLOCK-model grid
 * vocabulary every questioner's items are tagged with, and the `Questioner`
 * envelope every child of this directory implements. Documentation truth
 * lives in ./README.md (the family, the grid, the registers, the glossary);
 * this file is its type expression. Zero runtime exports, and exactly one
 * import — embody's structural types, type-only — so the parent compiles
 * away entirely.
 */

import type { Embodiment, Facts } from '../../embody/types.js';

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

/**
 * The pinned refusal arm of a questioner's ask — refusal as data, shared
 * across the family so every consumer narrows it the same way. It matches
 * the open engine's landed refusal arm exactly. `offset` is the failing
 * stage's source offset when the parser reports one; compare it to
 * `undefined`, never truthiness — offset 0 is a real position.
 */
export type QuestionerRefusal = {
	readonly ok: false;
	readonly error: {
		readonly message: string;
		readonly offset?: number;
	};
};

/**
 * The questioner kind's envelope — what every child of `lib/questioning/`
 * implements (the family's admission rule; README § The questioner family).
 *
 * `TAnswer` is the implementor's own success shape, carrying its items: the
 * family deliberately unifies no item type — merging item models is a
 * higher-order questioner's job at its own boundary. `TConfig` is the
 * implementor's own config shape; config is declarative and serializable as
 * a law of the kind (stated in the README, not encoded here), and there is
 * deliberately NO learner-model parameter — consumers map learner models
 * onto config from outside.
 *
 * The generic defaults matter: bare `Questioner` types a heterogeneous
 * roster a higher-order questioner can hold, drive, AND narrow —
 * `TConfig`'s `never` default makes config omittable-only on a bare
 * roster, and `TAnswer`'s ok-true default lets a bare-roster answer
 * narrow to the pinned refusal by its `ok` discriminant alone. That
 * default is the family's one extension of the refusal pin (human ruling
 * 2026-08-18): a child's success shape carries `ok: true` to ride a bare
 * roster — the landed open engine already does. The readonly
 * function-property syntax (never method shorthand) is deliberate: method
 * parameters are bivariant in TypeScript, and the roster variance above
 * relies on strict checking.
 *
 * Laws of the kind this contract carries (README § The questioner family,
 * § Ownership boundary): `serves` is a pure options-list answer over the
 * facts, not a total pre-check — serves-true followed by a refusal at ask
 * is a legal pairing; the read-bound — a questioner reads
 * `embodiment.facts` and never `embodiment.study`, so the lifecycle payload
 * crosses this type boundary unread; emitted values arrive frozen, and refusal is the pinned
 * data shape, never a throw and never a half-result. Ask answers directly
 * or behind a promise (human ruling 2026-08-18): the return widens to the
 * answer, the refusal, or a Promise of either, so a sync leaf costs
 * nothing and a dynamic questioner (runtime ground truth; README § Static
 * and dynamic ground truth) runs code, calls services, or consults agents
 * inside ask. Consumers await uniformly — awaiting a plain value is the
 * identity — and a bare-roster answer narrows by its `ok` discriminant
 * after the await (an un-awaited answer cannot be narrowed: the promise
 * arm has no `ok`, and the contract test pins that rejection). A returned
 * promise SETTLES AS DATA — the answer or the pinned refusal — and never
 * rejects: an async throw would be a third channel the refusal shape does
 * not cover, so settling is a law of the kind, not a type. The seam is
 * typed `Promise`, not `PromiseLike`, deliberately; cancellation is not
 * modeled (an abort parameter later is its own family-wide signature
 * event). `serves` stays synchronous and static — gate on statics, run
 * inside ask.
 */
export type Questioner<TAnswer = { readonly ok: true }, TConfig = never> = {
	/** The questioner's stable name — the family's roster identity. */
	readonly name: string;
	/** May this questioner serve this code? Pure, boolean, no cause. */
	readonly serves: (facts: Facts) => boolean;
	/** The main operation: embodiment in, frozen items out — or refusal; directly, or behind a promise that settles as data. */
	readonly ask: (
		embodiment: Embodiment,
		config?: TConfig,
	) => TAnswer | QuestionerRefusal | Promise<TAnswer | QuestionerRefusal>;
};
