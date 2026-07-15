/**
 * @file The realm-binding reader — quizzing's deletable Class-B shim for JeJ's
 * built-in realm globals. JeJ programs reference 14 globals (`Math`, `console`,
 * `parseInt`, `Infinity`, …) that are NOT declared in the program: they live in the
 * *realm* (the world the script is born into), resolved by the scope chain's
 * outermost frame. `resolveBinding` only sees program declarations — the scope
 * forest quizzing builds has `program` / `block` / `for-of` scopes but no
 * intrinsics/host frame — so it returns `null` for a realm name. This shim answers
 * the missing question: "is this name a known realm global, and if so, what kind?"
 *
 * It is a Class-B accessor (DOCS § "The accessor-helper seam"): `readRealmBinding`'s
 * BODY swaps — from this frozen table to a read of the snippet's intrinsics/host
 * scope frames — when embody ships a real realm surface (`RealmData` +
 * `RealmBindingEntwined`); the inline `REALM_BINDINGS` table is what gets deleted,
 * while the accessor name and its `RealmBindingData | null` signature survive (they
 * answer a domain question, not an embody-field shape), so every caller is untouched
 * — the same body-only swap as the sibling `resolving/read-scope-forest.ts`. The
 * return shape is stable across the swap: `RealmBindingEntwined.data` IS a
 * `RealmBindingData`, so no downstream importer churns. The `RealmBindingData` type
 * is imported TYPE-ONLY (the shim mirrors the shape as data; it never constructs an
 * embody type). `value` is a `null` placeholder — quizzing NEVER evaluates a global.
 *
 * The membership is JEJ's curated realm from the notional-machine doc
 * (`embody/language-levels/just-enough-javascript/notional-machine.md` § Realm,
 * L330-405): the ECMA-262 intrinsics set by `SetDefaultGlobalBindings` (§9.3.4) and
 * the HTML host bindings from `InitializeHostDefinedRealm` (§9.6). `globalThis` and
 * `RegExp` are deliberately EXCLUDED ("not in JEJ scope" / "no RegExp constructor in
 * JEJ", same doc). Two axes cross: `category` (intrinsic vs host) and `valueCategory`
 * (object-register vs function vs constant) — independent, so a host binding can be
 * an object-register (`console`) and a callable intrinsic can be object-register
 * (`String`/`Number` carry static methods + a prototype) or function (`Boolean`).
 */

/* eslint-disable sonarjs/no-duplicate-string -- curated realm-table data: each
   `category` / `valueCategory` value repeats across rows by design, so every entry
   reads as a self-contained data row (the frozen curated-table shape). */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { RealmBindingData } from '../../../../embody/types.js';

/**
 * The frozen curated realm table — JeJ's 14 known globals, keyed by name. The
 * literal is given an explicit `Record<string, RealmBindingData>` type argument so
 * each `category` / `valueCategory` is checked against the embody union (not widened
 * to `string`). Grouped by the notional-machine doc's populations, not alphabetized.
 * `value: null` throughout — a placeholder the quizzing forms never read.
 */
const REALM_BINDINGS = deepFreezeInPlace<Record<string, RealmBindingData>>({
	// ── ECMA-262 intrinsics (SetDefaultGlobalBindings §9.3.4) ──
	// object registers — boxes with methods + a prototype
	Math: {
		category: 'intrinsic',
		name: 'Math',
		valueCategory: 'object-register',
		value: null,
	},
	String: {
		category: 'intrinsic',
		name: 'String',
		valueCategory: 'object-register',
		value: null,
	},
	Number: {
		category: 'intrinsic',
		name: 'Number',
		valueCategory: 'object-register',
		value: null,
	},
	Date: {
		category: 'intrinsic',
		name: 'Date',
		valueCategory: 'object-register',
		value: null,
	},
	// standalone functions — callable conversion / parsing values
	parseInt: {
		category: 'intrinsic',
		name: 'parseInt',
		valueCategory: 'function',
		value: null,
	},
	parseFloat: {
		category: 'intrinsic',
		name: 'parseFloat',
		valueCategory: 'function',
		value: null,
	},
	Boolean: {
		category: 'intrinsic',
		name: 'Boolean',
		valueCategory: 'function',
		value: null,
	},
	// constants — bare primitive values
	Infinity: {
		category: 'intrinsic',
		name: 'Infinity',
		valueCategory: 'constant',
		value: null,
	},
	NaN: {
		category: 'intrinsic',
		name: 'NaN',
		valueCategory: 'constant',
		value: null,
	},
	undefined: {
		category: 'intrinsic',
		name: 'undefined',
		valueCategory: 'constant',
		value: null,
	},
	// ── HTML host bindings (InitializeHostDefinedRealm §9.6) ──
	console: {
		category: 'host',
		name: 'console',
		valueCategory: 'object-register',
		value: null,
	},
	alert: {
		category: 'host',
		name: 'alert',
		valueCategory: 'function',
		value: null,
	},
	confirm: {
		category: 'host',
		name: 'confirm',
		valueCategory: 'function',
		value: null,
	},
	prompt: {
		category: 'host',
		name: 'prompt',
		valueCategory: 'function',
		value: null,
	},
});

/**
 * Read the realm binding for an identifier `name`, or `null` when it is not a known
 * JeJ realm global.
 *
 * @remarks
 * - **`Object.hasOwn`-guarded — load-bearing, not decorative.** A plain-object lookup
 *   `REALM_BINDINGS[name]` would return an inherited `Object.prototype` method for a
 *   query like `toString` / `constructor` / `valueOf` / `__proto__` (the classic
 *   plain-object-as-map trap), leaking a prototype method as a "realm hit". The
 *   `Object.hasOwn` guard restricts the answer to the table's OWN keys. Mirrors
 *   `lib/documenting/document-jej.ts`.
 * - **Pure / total / never throws.** Same `name` → same result; returns `null` for
 *   any name outside the 14 (undeclared free names, typos, excluded globals).
 * - **Caller supplies a real scope-chain name.** The shim answers only "is this a
 *   realm global?"; whether the occurrence is a scope-chain reference (vs a property
 *   name, which has no realm provenance) is the caller's concern — the node-anchored
 *   V3 / V5 feed only `identifierAnchors`, so a property name never reaches here.
 */
export default function readRealmBinding(
	name: string,
): RealmBindingData | null {
	return Object.hasOwn(REALM_BINDINGS, name) ? REALM_BINDINGS[name] : null;
}
