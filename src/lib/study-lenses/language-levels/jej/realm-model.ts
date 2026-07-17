import freezeInPlace from '@utils/freeze-in-place.js';

import type {
	BindingForm,
	BindingPopulation,
	RealmBinding,
	RealmModel,
} from './types.js';

/**
 * Builds the realm model — the world this level teaches: the intrinsics and host
 * bindings JEJ admits, each by the form a lens draws it in. Needs no program.
 *
 * @remarks
 * The realm table is the level's one authored account of its world; the
 * allowlist's admitted globals are these names, derived rather than restated. A
 * fresh, deeply frozen model is built per use over the shared, immutable table.
 */
export default function buildRealmModel(): RealmModel {
	return freezeInPlace({ bindings: REALM_BINDINGS });
}

/**
 * The 17 bindings JEJ admits, grouped for presentation: intrinsics first
 * (object-register, then function, then constant), then the host bindings the
 * browser installs. The set is exactly the notional machine's § Realm — and the
 * source the allowlist's admitted globals derive from. The two populations are
 * kept structurally distinct, the distinction the level exists to teach.
 */
const REALM_BINDINGS = freezeInPlace<readonly RealmBinding[]>([
	...bindingsOf('intrinsic', 'object-register', [
		'Math',
		'String',
		'Number',
		'Date',
		'RegExp',
	]),
	...bindingsOf('intrinsic', 'function', [
		'Boolean',
		'BigInt',
		'parseInt',
		'parseFloat',
		'eval',
	]),
	...bindingsOf('intrinsic', 'constant', ['Infinity', 'NaN', 'undefined']),
	...bindingsOf('host', 'object-register', ['console']),
	...bindingsOf('host', 'function', ['alert', 'confirm', 'prompt']),
]);

/** Tags each name as a binding of the given population and form. */
function bindingsOf(
	population: BindingPopulation,
	form: BindingForm,
	names: readonly string[],
): readonly RealmBinding[] {
	return names.map((name) => ({ name, form, population }));
}
