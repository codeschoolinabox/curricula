import { describe, expect, it } from 'vitest';

import buildRealmModel from '../realm-model.js';

describe('buildRealmModel', () => {
	describe('the world the level teaches', () => {
		it('lists exactly the 17 admitted bindings, each by form and population', () => {
			expect(buildRealmModel().bindings).toEqual([
				{ name: 'Math', form: 'object-register', population: 'intrinsic' },
				{ name: 'String', form: 'object-register', population: 'intrinsic' },
				{ name: 'Number', form: 'object-register', population: 'intrinsic' },
				{ name: 'Date', form: 'object-register', population: 'intrinsic' },
				{ name: 'RegExp', form: 'object-register', population: 'intrinsic' },
				{ name: 'Boolean', form: 'function', population: 'intrinsic' },
				{ name: 'BigInt', form: 'function', population: 'intrinsic' },
				{ name: 'parseInt', form: 'function', population: 'intrinsic' },
				{ name: 'parseFloat', form: 'function', population: 'intrinsic' },
				{ name: 'eval', form: 'function', population: 'intrinsic' },
				{ name: 'Infinity', form: 'constant', population: 'intrinsic' },
				{ name: 'NaN', form: 'constant', population: 'intrinsic' },
				{ name: 'undefined', form: 'constant', population: 'intrinsic' },
				{ name: 'console', form: 'object-register', population: 'host' },
				{ name: 'alert', form: 'function', population: 'host' },
				{ name: 'confirm', form: 'function', population: 'host' },
				{ name: 'prompt', form: 'function', population: 'host' },
			]);
		});
	});

	describe('the model is deeply frozen', () => {
		it('the model itself is frozen', () => {
			expect(Object.isFrozen(buildRealmModel())).toBe(true);
		});

		it('the bindings array is frozen', () => {
			expect(Object.isFrozen(buildRealmModel().bindings)).toBe(true);
		});

		it('every binding is frozen', () => {
			const everyBindingFrozen = buildRealmModel().bindings.every((binding) =>
				Object.isFrozen(binding),
			);
			expect(everyBindingFrozen).toBe(true);
		});
	});
});
