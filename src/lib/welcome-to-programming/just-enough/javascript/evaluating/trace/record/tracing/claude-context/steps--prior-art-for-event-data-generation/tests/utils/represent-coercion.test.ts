import representCoercion from '../../utils/represent-coercion.js';

// Test data - validated in 'test data validation' describe block
const FALSY_VALUES = [
	false,
	0,
	-0,
	0n,
	'',
	null,
	undefined,
	Number.NaN,
] as const;
const TRUTHY_VALUES = [
	true,
	1,
	'hello',
	[],
	{},
	() => {},
	Symbol('test'),
	42n,
] as const;

describe('represent-coercion', () => {
	describe('test data validation', () => {
		describe('falsy values', () => {
			it.each([
				[false],
				[0],
				[-0],
				[0n],
				[''],
				[null],
				[undefined],
				[Number.NaN],
			])('%p is falsy', (value) => {
				expect(Boolean(value)).toBe(false);
			});
		});

		describe('truthy values', () => {
			it.each([
				[true],
				[1],
				['hello'],
				[[]],
				[{}],
				[() => {}],
				[Symbol('test')],
				[42n],
			])('%p is truthy', (value) => {
				expect(Boolean(value)).toBe(true);
			});
		});
	});

	describe('NOT operator coercion to boolean', () => {
		describe('falsy values → boolean false', () => {
			it.each(FALSY_VALUES)('%p → coerces to boolean false', (value) => {
				const [coerced] = representCoercion('!', [value], 'full');
				expect(coerced).toEqual({
					type: 'boolean',
					value: false,
					lookup: ['Boolean', 'Object', 'null'],
					instance: null,
				});
			});
		});

		describe('truthy values → boolean true', () => {
			it.each(TRUTHY_VALUES)('%p → coerces to boolean true', (value) => {
				const [coerced] = representCoercion('!', [value], 'full');
				expect(coerced).toEqual({
					type: 'boolean',
					value: true,
					lookup: ['Boolean', 'Object', 'null'],
					instance: null,
				});
			});
		});

		it('boxed Boolean(false) is truthy → coerces to true', () => {
			const boxedBoolean = new Boolean(false);
			const [coerced] = representCoercion('!', [boxedBoolean], 'full');
			expect(coerced).toEqual({
				type: 'boolean',
				value: true,
				lookup: ['Boolean', 'Object', 'null'],
				instance: null,
			});
		});
	});

	describe('other unary operators return operand representation (no coercion)', () => {
		it.each(['+', '-', '~', 'typeof', 'void', 'delete'])(
			'%s operator returns operand as-is',
			(op) => {
				const [operand] = representCoercion(op, [5], 'full');
				expect(operand).toEqual({
					type: 'number',
					value: 5,
					lookup: ['Number', 'Object', 'null'],
					instance: null,
				});
			},
		);
	});

	describe('addition operator (+) dual behavior', () => {
		describe('string concatenation path', () => {
			it('coerces number to string when other operand is string', () => {
				const [coerced, unchanged] = representCoercion(
					'+',
					[5, 'hello'],
					'full',
				);
				expect(coerced).toEqual({
					type: 'string',
					value: '5',
					lookup: ['String', 'Object', 'null'],
					instance: null,
				});
				expect(unchanged).toEqual({
					type: 'string',
					value: 'hello',
					lookup: ['String', 'Object', 'null'],
					instance: null,
				});
			});

			it('coerces boolean to string', () => {
				const [unchanged, coerced] = representCoercion(
					'+',
					['test', true],
					'full',
				);
				expect(unchanged).toEqual({
					type: 'string',
					value: 'test',
					lookup: ['String', 'Object', 'null'],
					instance: null,
				});
				expect(coerced).toEqual({
					type: 'string',
					value: 'true',
					lookup: ['String', 'Object', 'null'],
					instance: null,
				});
			});

			it('coerces null to string', () => {
				const [unchanged, coerced] = representCoercion(
					'+',
					['hello', null],
					'full',
				);
				expect(unchanged).toEqual({
					type: 'string',
					value: 'hello',
					lookup: ['String', 'Object', 'null'],
					instance: null,
				});
				expect(coerced).toEqual({
					type: 'string',
					value: 'null',
					lookup: ['String', 'Object', 'null'],
					instance: null,
				});
			});

			it('coerces undefined to string', () => {
				const [unchanged, coerced] = representCoercion(
					'+',
					['hello', undefined],
					'full',
				);
				expect(unchanged).toEqual({
					type: 'string',
					value: 'hello',
					lookup: ['String', 'Object', 'null'],
					instance: null,
				});
				expect(coerced).toEqual({
					type: 'string',
					value: 'undefined',
					lookup: ['String', 'Object', 'null'],
					instance: null,
				});
			});

			it('no coercion when both are strings', () => {
				const [left, right] = representCoercion(
					'+',
					['hello', 'world'],
					'full',
				);
				expect(left).toEqual({
					type: 'string',
					value: 'hello',
					lookup: ['String', 'Object', 'null'],
					instance: null,
				});
				expect(right).toEqual({
					type: 'string',
					value: 'world',
					lookup: ['String', 'Object', 'null'],
					instance: null,
				});
			});
		});

		describe('numeric addition path', () => {
			it('no coercion when both are numbers', () => {
				const [left, right] = representCoercion('+', [5, 10], 'full');
				expect(left).toEqual({
					type: 'number',
					value: 5,
					lookup: ['Number', 'Object', 'null'],
					instance: null,
				});
				expect(right).toEqual({
					type: 'number',
					value: 10,
					lookup: ['Number', 'Object', 'null'],
					instance: null,
				});
			});

			it('coerces boolean to number', () => {
				const [coerced, unchanged] = representCoercion('+', [true, 5], 'full');
				expect(coerced).toEqual({
					type: 'number',
					value: 1,
					lookup: ['Number', 'Object', 'null'],
					instance: null,
				});
				expect(unchanged).toEqual({
					type: 'number',
					value: 5,
					lookup: ['Number', 'Object', 'null'],
					instance: null,
				});
			});

			it('coerces null to 0', () => {
				const [coerced, unchanged] = representCoercion('+', [null, 5], 'full');
				expect(coerced).toEqual({
					type: 'number',
					value: 0,
					lookup: ['Number', 'Object', 'null'],
					instance: null,
				});
				expect(unchanged).toEqual({
					type: 'number',
					value: 5,
					lookup: ['Number', 'Object', 'null'],
					instance: null,
				});
			});

			it('coerces undefined to NaN', () => {
				const [coerced, unchanged] = representCoercion(
					'+',
					[undefined, 5],
					'full',
				);
				expect(coerced.type).toBe('number');
				expect(Number.isNaN(coerced.value)).toBe(true);
				expect(coerced.instance).toBeNull();
				expect(unchanged).toEqual({
					type: 'number',
					value: 5,
					lookup: ['Number', 'Object', 'null'],
					instance: null,
				});
			});
		});
	});

	describe('numeric operators (-, *, /, %, **)', () => {
		describe.each(['-', '*', '/', '%', '**'])('%s operator', (op) => {
			it('coerces string to number', () => {
				const [coerced, unchanged] = representCoercion(op, ['10', 5], 'full');
				expect(coerced).toEqual({
					type: 'number',
					value: 10,
					lookup: ['Number', 'Object', 'null'],
					instance: null,
				});
				expect(unchanged).toEqual({
					type: 'number',
					value: 5,
					lookup: ['Number', 'Object', 'null'],
					instance: null,
				});
			});

			it('coerces boolean to number', () => {
				const [unchanged, coerced] = representCoercion(op, [20, true], 'full');
				expect(unchanged).toEqual({
					type: 'number',
					value: 20,
					lookup: ['Number', 'Object', 'null'],
					instance: null,
				});
				expect(coerced).toEqual({
					type: 'number',
					value: 1,
					lookup: ['Number', 'Object', 'null'],
					instance: null,
				});
			});

			it('no coercion when both are numbers', () => {
				const [left, right] = representCoercion(op, [10, 5], 'full');
				expect(left).toEqual({
					type: 'number',
					value: 10,
					lookup: ['Number', 'Object', 'null'],
					instance: null,
				});
				expect(right).toEqual({
					type: 'number',
					value: 5,
					lookup: ['Number', 'Object', 'null'],
					instance: null,
				});
			});
		});
	});

	describe('bitwise operators (|, &, ^, <<, >>, >>>)', () => {
		it.each(['|', '&', '^', '<<', '>>', '>>>'])(
			'%s coerces to number',
			(op) => {
				const [coerced, unchanged] = representCoercion(op, ['5', 3], 'full');
				expect(coerced).toEqual({
					type: 'number',
					value: 5,
					lookup: ['Number', 'Object', 'null'],
					instance: null,
				});
				expect(unchanged).toEqual({
					type: 'number',
					value: 3,
					lookup: ['Number', 'Object', 'null'],
					instance: null,
				});
			},
		);
	});

	describe('comparison operators (<, >, <=, >=)', () => {
		it('no coercion when both are strings', () => {
			const [left, right] = representCoercion('<', ['abc', 'def'], 'full');
			expect(left).toEqual({
				type: 'string',
				value: 'abc',
				lookup: ['String', 'Object', 'null'],
				instance: null,
			});
			expect(right).toEqual({
				type: 'string',
				value: 'def',
				lookup: ['String', 'Object', 'null'],
				instance: null,
			});
		});

		it('coerces to number when types differ', () => {
			const [coerced, unchanged] = representCoercion('<', ['10', 5], 'full');
			expect(coerced).toEqual({
				type: 'number',
				value: 10,
				lookup: ['Number', 'Object', 'null'],
				instance: null,
			});
			expect(unchanged).toEqual({
				type: 'number',
				value: 5,
				lookup: ['Number', 'Object', 'null'],
				instance: null,
			});
		});

		it('coerces boolean to number for comparison', () => {
			const [coerced, unchanged] = representCoercion('>', [true, 0], 'full');
			expect(coerced).toEqual({
				type: 'number',
				value: 1,
				lookup: ['Number', 'Object', 'null'],
				instance: null,
			});
			expect(unchanged).toEqual({
				type: 'number',
				value: 0,
				lookup: ['Number', 'Object', 'null'],
				instance: null,
			});
		});
	});

	describe('abstract equality (==, !=)', () => {
		it('null == undefined special case (no coercion)', () => {
			const [left1, right1] = representCoercion(
				'==',
				[null, undefined],
				'full',
			);
			expect(left1).toEqual({
				type: 'object',
				value: null,
				lookup: [],
				instance: null,
			});
			expect(right1).toEqual({
				type: 'undefined',
				value: undefined,
				lookup: [],
				instance: null,
			});

			const [left2, right2] = representCoercion(
				'==',
				[undefined, null],
				'full',
			);
			expect(left2).toEqual({
				type: 'undefined',
				value: undefined,
				lookup: [],
				instance: null,
			});
			expect(right2).toEqual({
				type: 'object',
				value: null,
				lookup: [],
				instance: null,
			});
		});

		it('number vs string coerces string to number', () => {
			const [unchanged, coerced] = representCoercion('==', [5, '5'], 'full');
			expect(unchanged).toEqual({
				type: 'number',
				value: 5,
				lookup: ['Number', 'Object', 'null'],
				instance: null,
			});
			expect(coerced).toEqual({
				type: 'number',
				value: 5,
				lookup: ['Number', 'Object', 'null'],
				instance: null,
			});
		});

		it('boolean coerces to number', () => {
			const [coerced, unchanged] = representCoercion('==', [true, 1], 'full');
			expect(coerced).toEqual({
				type: 'number',
				value: 1,
				lookup: ['Number', 'Object', 'null'],
				instance: null,
			});
			expect(unchanged).toEqual({
				type: 'number',
				value: 1,
				lookup: ['Number', 'Object', 'null'],
				instance: null,
			});
		});

		it('object ToPrimitive coercion', () => {
			const objectWithValueOf = {
				valueOf() {
					return 42;
				},
				toString() {
					return 'not used';
				},
			};
			const [coerced, unchanged] = representCoercion(
				'==',
				[objectWithValueOf, 42],
				'full',
			);
			expect(coerced).toEqual({
				type: 'number',
				value: 42,
				lookup: ['Number', 'Object', 'null'],
				instance: null,
			});
			expect(unchanged).toEqual({
				type: 'number',
				value: 42,
				lookup: ['Number', 'Object', 'null'],
				instance: null,
			});
		});

		it('object uses toString when valueOf not present', () => {
			const objectWithToString = {
				toString() {
					return '42';
				},
			};
			const [coerced, unchanged] = representCoercion(
				'==',
				[objectWithToString, '42'],
				'full',
			);
			expect(coerced).toEqual({
				type: 'string',
				value: '42',
				lookup: ['String', 'Object', 'null'],
				instance: null,
			});
			expect(unchanged).toEqual({
				type: 'string',
				value: '42',
				lookup: ['String', 'Object', 'null'],
				instance: null,
			});
		});
	});

	describe('strict equality (===, !==) never coerces', () => {
		it('=== returns no coercion', () => {
			const [left1, right1] = representCoercion('===', [5, '5'], 'full');
			expect(left1).toEqual({
				type: 'number',
				value: 5,
				lookup: ['Number', 'Object', 'null'],
				instance: null,
			});
			expect(right1).toEqual({
				type: 'string',
				value: '5',
				lookup: ['String', 'Object', 'null'],
				instance: null,
			});

			const [left2, right2] = representCoercion(
				'===',
				[null, undefined],
				'full',
			);
			expect(left2).toEqual({
				type: 'object',
				value: null,
				lookup: [],
				instance: null,
			});
			expect(right2).toEqual({
				type: 'undefined',
				value: undefined,
				lookup: [],
				instance: null,
			});

			const [left3, right3] = representCoercion('===', [true, 1], 'full');
			expect(left3).toEqual({
				type: 'boolean',
				value: true,
				lookup: ['Boolean', 'Object', 'null'],
				instance: null,
			});
			expect(right3).toEqual({
				type: 'number',
				value: 1,
				lookup: ['Number', 'Object', 'null'],
				instance: null,
			});
		});

		it('!== returns no coercion', () => {
			const [left1, right1] = representCoercion('!==', [5, '5'], 'full');
			expect(left1).toEqual({
				type: 'number',
				value: 5,
				lookup: ['Number', 'Object', 'null'],
				instance: null,
			});
			expect(right1).toEqual({
				type: 'string',
				value: '5',
				lookup: ['String', 'Object', 'null'],
				instance: null,
			});

			const [left2, right2] = representCoercion('!==', [false, 0], 'full');
			expect(left2).toEqual({
				type: 'boolean',
				value: false,
				lookup: ['Boolean', 'Object', 'null'],
				instance: null,
			});
			expect(right2).toEqual({
				type: 'number',
				value: 0,
				lookup: ['Number', 'Object', 'null'],
				instance: null,
			});
		});
	});

	describe('logical operators deferred to short-circuiting factory', () => {
		it('&& returns both operands', () => {
			const [left1, right1] = representCoercion('&&', [5, 10], 'full');
			expect(left1).toEqual({
				type: 'number',
				value: 5,
				lookup: ['Number', 'Object', 'null'],
				instance: null,
			});
			expect(right1).toEqual({
				type: 'number',
				value: 10,
				lookup: ['Number', 'Object', 'null'],
				instance: null,
			});

			const [left2, right2] = representCoercion('&&', [0, 10], 'full');
			expect(left2).toEqual({
				type: 'number',
				value: 0,
				lookup: ['Number', 'Object', 'null'],
				instance: null,
			});
			expect(right2).toEqual({
				type: 'number',
				value: 10,
				lookup: ['Number', 'Object', 'null'],
				instance: null,
			});
		});

		it('|| returns both operands', () => {
			const [left1, right1] = representCoercion('||', [5, 10], 'full');
			expect(left1).toEqual({
				type: 'number',
				value: 5,
				lookup: ['Number', 'Object', 'null'],
				instance: null,
			});
			expect(right1).toEqual({
				type: 'number',
				value: 10,
				lookup: ['Number', 'Object', 'null'],
				instance: null,
			});

			const [left2, right2] = representCoercion('||', [0, 10], 'full');
			expect(left2).toEqual({
				type: 'number',
				value: 0,
				lookup: ['Number', 'Object', 'null'],
				instance: null,
			});
			expect(right2).toEqual({
				type: 'number',
				value: 10,
				lookup: ['Number', 'Object', 'null'],
				instance: null,
			});
		});

		it('?? (nullish coalescing) returns both operands', () => {
			const [left1, right1] = representCoercion('??', [null, 10], 'full');
			expect(left1).toEqual({
				type: 'object',
				value: null,
				lookup: [],
				instance: null,
			});
			expect(right1).toEqual({
				type: 'number',
				value: 10,
				lookup: ['Number', 'Object', 'null'],
				instance: null,
			});

			const [left2, right2] = representCoercion('??', [undefined, 10], 'full');
			expect(left2).toEqual({
				type: 'undefined',
				value: undefined,
				lookup: [],
				instance: null,
			});
			expect(right2).toEqual({
				type: 'number',
				value: 10,
				lookup: ['Number', 'Object', 'null'],
				instance: null,
			});

			const [left3, right3] = representCoercion('??', [0, 10], 'full');
			expect(left3).toEqual({
				type: 'number',
				value: 0,
				lookup: ['Number', 'Object', 'null'],
				instance: null,
			});
			expect(right3).toEqual({
				type: 'number',
				value: 10,
				lookup: ['Number', 'Object', 'null'],
				instance: null,
			});
		});
	});

	describe('in operator', () => {
		it('coerces left operand to string', () => {
			const [coerced, unchanged] = representCoercion('in', [5, []], 'full');
			expect(coerced).toEqual({
				type: 'string',
				value: '5',
				lookup: ['String', 'Object', 'null'],
				instance: null,
			});
			expect(unchanged.type).toBe('object');
			expect(Array.isArray(unchanged.value)).toBe(true);
			expect(unchanged.lookup).toEqual(['Array', 'Object', 'null']);
		});

		it('no coercion when left is already string', () => {
			const [left, right] = representCoercion('in', ['length', []], 'full');
			expect(left).toEqual({
				type: 'string',
				value: 'length',
				lookup: ['String', 'Object', 'null'],
				instance: null,
			});
			expect(right.type).toBe('object');
			expect(Array.isArray(right.value)).toBe(true);
		});

		it('coerces symbol to string', () => {
			const sym = Symbol('test');
			const [coerced, unchanged] = representCoercion('in', [sym, {}], 'full');
			expect(coerced).toEqual({
				type: 'string',
				value: 'Symbol(test)',
				lookup: ['String', 'Object', 'null'],
				instance: null,
			});
			expect(unchanged.type).toBe('object');
			expect(typeof unchanged.value).toBe('object');
		});
	});

	describe('instanceof operator (no coercion)', () => {
		it('instanceof never coerces', () => {
			const [left, right] = representCoercion(
				'instanceof',
				[{}, Object],
				'full',
			);
			expect(left.type).toBe('object');
			expect(typeof left.value).toBe('object');
			expect(right.type).toBe('function');
			expect(right.value.name).toBe('Object');
		});
	});

	describe('ternary and higher arity operators', () => {
		it('returns all operands for ternary operators', () => {
			const [cond, consequent, alternate] = representCoercion(
				'?:',
				[true, 'yes', 'no'],
				'full',
			);
			expect(cond).toEqual({
				type: 'boolean',
				value: true,
				lookup: ['Boolean', 'Object', 'null'],
				instance: null,
			});
			expect(consequent).toEqual({
				type: 'string',
				value: 'yes',
				lookup: ['String', 'Object', 'null'],
				instance: null,
			});
			expect(alternate).toEqual({
				type: 'string',
				value: 'no',
				lookup: ['String', 'Object', 'null'],
				instance: null,
			});
		});

		it('returns all operands for any arity', () => {
			const result = representCoercion('customOp', [1, 2, 3, 4, 5], 'full');
			expect(result).toEqual([
				{
					type: 'number',
					value: 1,
					lookup: ['Number', 'Object', 'null'],
					instance: null,
				},
				{
					type: 'number',
					value: 2,
					lookup: ['Number', 'Object', 'null'],
					instance: null,
				},
				{
					type: 'number',
					value: 3,
					lookup: ['Number', 'Object', 'null'],
					instance: null,
				},
				{
					type: 'number',
					value: 4,
					lookup: ['Number', 'Object', 'null'],
					instance: null,
				},
				{
					type: 'number',
					value: 5,
					lookup: ['Number', 'Object', 'null'],
					instance: null,
				},
			]);
		});
	});

	describe('all coercions produce primitives', () => {
		it('string coercion always produces primitive string', () => {
			const [coerced, unchanged] = representCoercion(
				'+',
				[new String('boxed'), 'test'],
				'full',
			);
			expect(coerced.type).toBe('string');
			expect(coerced.instance).toBeNull();
			expect(unchanged.type).toBe('string');
			expect(unchanged.value).toBe('test');
		});

		it('number coercion always produces primitive number', () => {
			const [coerced, unchanged] = representCoercion(
				'-',
				[new Number(10), 5],
				'full',
			);
			expect(coerced.type).toBe('number');
			expect(coerced.instance).toBeNull();
			expect(unchanged.type).toBe('number');
			expect(unchanged.value).toBe(5);
		});

		it('boolean coercion always produces primitive boolean', () => {
			const [coerced] = representCoercion('!', [new Boolean(false)], 'full');
			expect(coerced.type).toBe('boolean');
			expect(coerced.instance).toBeNull();
		});
	});
});
