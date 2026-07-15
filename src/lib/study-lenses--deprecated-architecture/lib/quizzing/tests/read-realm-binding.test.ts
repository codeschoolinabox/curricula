import { describe, expect, it } from 'vitest';

import type { RealmBindingData } from '../../../../embody/types.js';
import readRealmBinding from '../realm/read-realm-binding.js';

// The 14 curated JeJ realm globals (notional-machine.md § Realm, L330-405), by
// category × valueCategory. This mirrors the doc directly — the test's source of
// truth is the notional machine, not the shim it checks.
const EXPECTED: Readonly<Record<string, Omit<RealmBindingData, 'value'>>> = {
	Math: {
		category: 'intrinsic',
		name: 'Math',
		valueCategory: 'object-register',
	},
	String: {
		category: 'intrinsic',
		name: 'String',
		valueCategory: 'object-register',
	},
	Number: {
		category: 'intrinsic',
		name: 'Number',
		valueCategory: 'object-register',
	},
	Date: {
		category: 'intrinsic',
		name: 'Date',
		valueCategory: 'object-register',
	},
	parseInt: {
		category: 'intrinsic',
		name: 'parseInt',
		valueCategory: 'function',
	},
	parseFloat: {
		category: 'intrinsic',
		name: 'parseFloat',
		valueCategory: 'function',
	},
	Boolean: {
		category: 'intrinsic',
		name: 'Boolean',
		valueCategory: 'function',
	},
	Infinity: {
		category: 'intrinsic',
		name: 'Infinity',
		valueCategory: 'constant',
	},
	NaN: { category: 'intrinsic', name: 'NaN', valueCategory: 'constant' },
	undefined: {
		category: 'intrinsic',
		name: 'undefined',
		valueCategory: 'constant',
	},
	console: {
		category: 'host',
		name: 'console',
		valueCategory: 'object-register',
	},
	alert: { category: 'host', name: 'alert', valueCategory: 'function' },
	confirm: { category: 'host', name: 'confirm', valueCategory: 'function' },
	prompt: { category: 'host', name: 'prompt', valueCategory: 'function' },
};

describe('readRealmBinding', () => {
	describe('Zero', () => {
		it('returns null for an undeclared non-realm name', () => {
			expect(readRealmBinding('x')).toBeNull();
		});

		it('returns null for the empty string', () => {
			expect(readRealmBinding('')).toBeNull();
		});
	});

	describe('One', () => {
		it('reads Math as an intrinsic object-register with a null value', () => {
			expect(readRealmBinding('Math')).toEqual({
				category: 'intrinsic',
				name: 'Math',
				valueCategory: 'object-register',
				value: null,
			});
		});
	});

	describe('Many — every curated global returns its exact grid entry', () => {
		for (const [name, expected] of Object.entries(EXPECTED)) {
			it(`reads ${name}`, () => {
				expect(readRealmBinding(name)).toEqual({ ...expected, value: null });
			});
		}
	});

	describe('Boundaries — membership edges', () => {
		it('excludes globalThis and RegExp (not in JeJ scope)', () => {
			expect(readRealmBinding('globalThis')).toBeNull();
			expect(readRealmBinding('RegExp')).toBeNull();
		});

		it('returns null for real JS globals outside the JeJ realm', () => {
			for (const name of [
				'Array',
				'Object',
				'JSON',
				'Symbol',
				'Promise',
				'window',
				'document',
				'setTimeout',
				// bare `isNaN` / `isFinite` are real ECMA-262 globals sitting textually
				// next to Number's own `isNaN`/`isFinite`/`isInteger` in the NM doc
				// (L365-370) — the most plausible way a careless transcription adds a
				// spurious 15th top-level key. They are NOT in the JeJ realm.
				'isNaN',
				'isFinite',
				'isInteger',
			]) {
				expect(readRealmBinding(name)).toBeNull();
			}
		});

		it('keys Boolean as a function (not an object-register)', () => {
			expect(readRealmBinding('Boolean')?.valueCategory).toBe('function');
		});

		it('keys String and Number as object-registers despite being callable', () => {
			expect(readRealmBinding('String')?.valueCategory).toBe('object-register');
			expect(readRealmBinding('Number')?.valueCategory).toBe('object-register');
		});

		it('keys console as a host object-register', () => {
			const consoleBinding = readRealmBinding('console');
			expect(consoleBinding?.category).toBe('host');
			expect(consoleBinding?.valueCategory).toBe('object-register');
		});
	});

	describe('Boundaries — prototype-pollution guard (the plain-object-as-map trap)', () => {
		for (const poison of [
			'toString',
			'constructor',
			'hasOwnProperty',
			'__proto__',
			'valueOf',
			'isPrototypeOf',
			'propertyIsEnumerable',
		]) {
			it(`does not leak Object.prototype.${poison} as a realm hit`, () => {
				expect(readRealmBinding(poison)).toBeNull();
			});
		}
	});

	describe('Interfaces', () => {
		it('returns an entry with exactly the RealmBindingData fields', () => {
			// field-set equality, order-independent — the entry's key insertion order
			// is an implementation detail `RealmBindingData` does not constrain.
			expect(new Set(Object.keys(readRealmBinding('parseInt') ?? {}))).toEqual(
				new Set(['category', 'name', 'valueCategory', 'value']),
			);
		});

		it('sets value to null (quizzing never evaluates a global)', () => {
			expect(readRealmBinding('Math')?.value).toBeNull();
		});

		it('sets name to the queried name', () => {
			expect(readRealmBinding('alert')?.name).toBe('alert');
		});

		it('returns a frozen entry', () => {
			expect(Object.isFrozen(readRealmBinding('Math'))).toBe(true);
		});
	});

	describe('Simple', () => {
		it('is deterministic', () => {
			expect(readRealmBinding('Math')).toEqual(readRealmBinding('Math'));
		});
	});
});
