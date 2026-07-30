/**
 * JEJ's own model types: the level's policy as data, and the two semantic
 * models that are its notional machine.
 *
 * It imports nothing — every shape the level does not own is declared
 * elsewhere and imported where it is used. `ParseFacts`, `SnippetType`, and
 * `LevelDocs` are the region's (`../types.ts`), which also publishes
 * `Violation` and `SourceRange`; the allowlist vocabulary the level's policy
 * is read through — `SyntaxAllowlist`, `NodeRule`, `ConstraintCheck` —
 * belongs to the screening leaf (`../../lib/screening/types.js`). A level that
 * redefined any of them would be a second source.
 *
 * Level docs: ./README.md (what JEJ curates) · ./DOCS.md (architecture).
 */

// ─────────────────────────────────────────────────────────────────────────────
// The realm model — the world this level teaches
//
// The realm table is the level's one authored account of its world. Everything
// else about that world is derived from it.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * How a realm binding presents itself, which is how a lens draws it.
 *
 * @remarks
 * `object-register` — a box with methods and a prototype (`Math`, `console`).
 * `function` — a callable value (`alert`, `parseInt`). `constant` — a bare
 * primitive (`Infinity`, `NaN`, `undefined`). This is the level's own
 * pedagogical framing, not a spec distinction.
 */
export type BindingForm = 'object-register' | 'function' | 'constant';

/**
 * Which of the realm's two populations installed a binding.
 *
 * @remarks
 * Spec-distinct, and kept distinct deliberately: intrinsics come from
 * `SetDefaultGlobalBindings` (ECMA-262 §9.3.4) and are always present; host
 * bindings come from the HTML host hook inside `InitializeHostDefinedRealm`
 * (§9.6) and are the browser's, not the language's. Collapsing them would
 * conflate "this is JavaScript" with "this is your browser" — a distinction
 * the level exists to teach.
 */
export type BindingPopulation = 'intrinsic' | 'host';

/**
 * One name the level's world provides before any code runs.
 *
 * @remarks
 * The authored datum. A name is admitted *because* it is here — the allowlist's
 * admitted globals are these names, derived rather than restated.
 */
export type RealmBinding = {
	readonly name: string;
	readonly form: BindingForm;
	readonly population: BindingPopulation;
};

/**
 * The world this level teaches, derived from no program at all.
 *
 * @remarks
 * Narrower than the world a program actually wakes into — a JEJ program runs
 * in a full JavaScript realm — so this answers "what is mine to use?", never
 * "what exists?". A lens rendering it as the latter would lie by omission.
 */
export type RealmModel = {
	readonly bindings: ReadonlyArray<RealmBinding>;
};
