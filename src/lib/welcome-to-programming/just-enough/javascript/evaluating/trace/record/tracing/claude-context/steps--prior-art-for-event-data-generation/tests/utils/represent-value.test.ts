import representValue from '../../utils/represent-value.js';

describe('represent-value with { type, value, lookup, instance } signature', () => {
  describe('null and undefined always have instance: null', () => {
    it('null: object type, empty lookup, null instance', () => {
      expect(representValue(null, 'full')).toEqual({
        type: 'object',
        value: null,
        lookup: [],
        instance: null,
      });
    });

    it('undefined: undefined type, empty lookup, null instance', () => {
      expect(representValue(undefined, 'full')).toEqual({
        type: 'undefined',
        value: undefined,
        lookup: [],
        instance: null,
      });
    });
  });

  describe('primitives: show lookup chain but instance is null', () => {
    it('number primitive has null instance', () => {
      expect(representValue(5, 'full')).toEqual({
        type: 'number',
        value: 5,
        lookup: ['Number', 'Object', 'null'],
        instance: null,
      });
    });

    it('string primitive has null instance', () => {
      expect(representValue('hello', 'full')).toEqual({
        type: 'string',
        value: 'hello',
        lookup: ['String', 'Object', 'null'],
        instance: null,
      });
    });

    it('boolean primitive has null instance', () => {
      expect(representValue(true, 'full')).toEqual({
        type: 'boolean',
        value: true,
        lookup: ['Boolean', 'Object', 'null'],
        instance: null,
      });

      expect(representValue(false, 'full')).toEqual({
        type: 'boolean',
        value: false,
        lookup: ['Boolean', 'Object', 'null'],
        instance: null,
      });
    });

    it('symbol primitive has null instance', () => {
      const sym = Symbol('test');
      expect(representValue(sym, 'full')).toEqual({
        type: 'symbol',
        value: 'Symbol(test)',
        lookup: ['Symbol', 'Object', 'null'],
        instance: null,
      });
    });

    it('bigint primitive has null instance', () => {
      expect(representValue(123n, 'full')).toEqual({
        type: 'bigint',
        value: 123n,
        lookup: ['BigInt', 'Object', 'null'],
        instance: null,
      });
    });
  });

  describe('special number values', () => {
    it('handles NaN', () => {
      const result = representValue(Number.NaN, 'full');
      expect(result.type).toBe('number');
      expect(Number.isNaN(result.value)).toBe(true);
      expect(result.instance).toBeNull();
    });

    it('handles Infinity', () => {
      expect(representValue(Infinity, 'full')).toEqual({
        type: 'number',
        value: Infinity,
        lookup: ['Number', 'Object', 'null'],
        instance: null,
      });
    });

    it('handles -Infinity', () => {
      expect(representValue(-Infinity, 'full')).toEqual({
        type: 'number',
        value: -Infinity,
        lookup: ['Number', 'Object', 'null'],
        instance: null,
      });
    });

    it('handles -0', () => {
      expect(representValue(-0, 'full')).toEqual({
        type: 'number',
        value: -0,
        lookup: ['Number', 'Object', 'null'],
        instance: null,
      });
    });
  });

  describe('boxed objects vs primitives - clear distinction via instance', () => {
    it('boxed number: object type with Number instance', () => {
      const boxed = new Number(5);
      const result = representValue(boxed, 'full');
      expect(result.type).toBe('object');
      expect(result.lookup).toEqual(['Number', 'Object', 'null']);
      expect(result.instance).toBe('Number');
      // Value will be deep cloned
      expect(result.value).toBeDefined();
    });

    it('boxed string: object type with String instance', () => {
      const boxed = new String('hello');
      const result = representValue(boxed, 'full');
      expect(result.type).toBe('object');
      expect(result.lookup).toEqual(['String', 'Object', 'null']);
      expect(result.instance).toBe('String');
    });

    it('boxed boolean: object type with Boolean instance', () => {
      const boxed = new Boolean(true);
      const result = representValue(boxed, 'full');
      expect(result.type).toBe('object');
      expect(result.lookup).toEqual(['Boolean', 'Object', 'null']);
      expect(result.instance).toBe('Boolean');
    });

    it('demonstrates primitive vs boxed distinction clearly', () => {
      const primitive = representValue(5, 'full');
      const boxed = representValue(new Number(5), 'full');

      // Different types
      expect(primitive.type).toBe('number');
      expect(boxed.type).toBe('object');

      // Clear instance distinction
      expect(primitive.instance).toBeNull();
      expect(boxed.instance).toBe('Number');

      // Same lookup chain
      expect(primitive.lookup).toEqual(boxed.lookup);
    });
  });

  describe('objects show actual prototype chain with correct instance', () => {
    it('array has Array instance', () => {
      const result = representValue([], 'full');
      expect(result).toEqual({
        type: 'object',
        value: [],
        lookup: ['Array', 'Object', 'null'],
        instance: 'Array',
      });
    });

    it('array with values', () => {
      const result = representValue([1, 2, 3], 'full');
      expect(result.type).toBe('object');
      expect(result.value).toEqual([1, 2, 3]);
      expect(result.lookup).toEqual(['Array', 'Object', 'null']);
      expect(result.instance).toBe('Array');
    });

    it('plain object has Object instance', () => {
      expect(representValue({}, 'full')).toEqual({
        type: 'object',
        value: {},
        lookup: ['Object', 'null'],
        instance: 'Object',
      });
    });

    it('object with properties', () => {
      const object = { a: 1, b: 'hello' };
      const result = representValue(object, 'full');
      expect(result.type).toBe('object');
      expect(result.value).toEqual({ a: 1, b: 'hello' });
      expect(result.lookup).toEqual(['Object', 'null']);
      expect(result.instance).toBe('Object');
    });

    it('null prototype object has null instance', () => {
      const nullProto = Object.create(null);
      const result = representValue(nullProto, 'full');
      expect(result.type).toBe('object');
      expect(result.lookup).toEqual([]);
      expect(result.instance).toBeNull();
    });

    it('Date object', () => {
      const date = new Date('2025-01-20');
      const result = representValue(date, 'full');
      expect(result.type).toBe('object');
      expect(result.lookup).toEqual(['Date', 'Object', 'null']);
      expect(result.instance).toBe('Date');
    });

    it('RegExp object', () => {
      const regex = /test/gi;
      const result = representValue(regex, 'full');
      expect(result.type).toBe('object');
      expect(result.lookup).toEqual(['RegExp', 'Object', 'null']);
      expect(result.instance).toBe('RegExp');
    });

    it('Map object', () => {
      const map = new Map([[1, 'a']]);
      const result = representValue(map, 'full');
      expect(result.type).toBe('object');
      expect(result.lookup).toEqual(['Map', 'Object', 'null']);
      expect(result.instance).toBe('Map');
    });

    it('Set object', () => {
      const set = new Set([1, 2, 3]);
      const result = representValue(set, 'full');
      expect(result.type).toBe('object');
      expect(result.lookup).toEqual(['Set', 'Object', 'null']);
      expect(result.instance).toBe('Set');
    });

    it('Error object', () => {
      const error = new Error('test');
      const result = representValue(error, 'full');
      expect(result.type).toBe('object');
      expect(result.lookup).toEqual(['Error', 'Object', 'null']);
      expect(result.instance).toBe('Error');
    });

    it('custom class inheritance shows most specific instance', () => {
      class MyError extends Error {}
      const error = new MyError('test');
      const result = representValue(error, 'full');
      expect(result.type).toBe('object');
      expect(result.lookup).toEqual(['MyError', 'Error', 'Object', 'null']);
      expect(result.instance).toBe('MyError');
    });

    it('deep inheritance chain', () => {
      class A {}
      class B extends A {}
      class C extends B {}
      const object = new C();
      const result = representValue(object, 'full');
      expect(result.lookup).toEqual(['C', 'B', 'A', 'Object', 'null']);
      expect(result.instance).toBe('C');
    });
  });

  describe('functions have Function instance', () => {
    it('regular function', () => {
      function test() {}
      const result = representValue(test, 'full');
      expect(result.type).toBe('function');
      expect(result.value).toEqual({
        name: 'test',
        length: 0,
        preview: 'function test() { }',
      });
      expect(result.lookup).toEqual(['Function', 'Object', 'null']);
      expect(result.instance).toBe('Function');
    });

    it('arrow function', () => {
      const arrow = () => {};
      const result = representValue(arrow, 'full');
      expect(result.type).toBe('function');
      expect(result.value.name).toBe('arrow');
      expect(result.instance).toBe('Function');
    });

    it('anonymous function', () => {
      const anon = function () {};
      const result = representValue(anon, 'full');
      expect(result.type).toBe('function');
      expect(result.value.name).toBe('anon');
      expect(result.instance).toBe('Function');
    });

    it('async function has AsyncFunction instance', () => {
      async function test() {}
      const result = representValue(test, 'full');
      expect(result.type).toBe('function');
      expect(result.instance).toBe('AsyncFunction');
      expect(result.lookup[0]).toBe('AsyncFunction');
    });

    it('generator function has GeneratorFunction instance', () => {
      function* test() {}
      const result = representValue(test, 'full');
      expect(result.type).toBe('function');
      expect(result.instance).toBe('GeneratorFunction');
      expect(result.lookup[0]).toBe('GeneratorFunction');
    });

    it('async generator function', () => {
      async function* test() {}
      const result = representValue(test, 'full');
      expect(result.type).toBe('function');
      expect(result.instance).toBe('AsyncGeneratorFunction');
      expect(result.lookup[0]).toBe('AsyncGeneratorFunction');
    });

    it('keeps only first line of multi-line functions', () => {
      const multi = function test(a, b, c) {
        return a + b + c;
      };
      const result = representValue(multi, 'full');
      // When converted to string, JavaScript puts parameters on one line
      expect(result.value.preview).toBe('function test(a, b, c) {');
    });

    it('function with parameters', () => {
      function withParameters(a, b, c) {}
      const result = representValue(withParameters, 'full');
      expect(result.value.length).toBe(3);
    });
  });

  describe('symbol uniqueness limitation', () => {
    it('documents that different symbols may have same string representation', () => {
      const s1 = Symbol('test');
      const s2 = Symbol('test');
      const repr1 = representValue(s1, 'full');
      const repr2 = representValue(s2, 'full');

      // Both have same string representation
      expect(repr1.value).toBe('Symbol(test)');
      expect(repr2.value).toBe('Symbol(test)');

      // Cannot distinguish between s1 and s2 in step entries
      // This is a known limitation - symbols lose uniqueness when serialized
      expect(repr1).toEqual(repr2);
    });

    it('global symbols via Symbol.for', () => {
      const global = Symbol.for('global');
      const result = representValue(global, 'full');
      expect(result.value).toBe('Symbol(global)');
      // Still can't distinguish from local Symbol('global')
    });

    it('symbols without description', () => {
      const noDesc = Symbol();
      const result = representValue(noDesc, 'full');
      expect(result.value).toBe('Symbol()');
    });
  });

  describe('pedagogical value of instance field', () => {
    it('shows why (5).toString() works despite null instance', () => {
      const five = representValue(5, 'full');
      expect(five.instance).toBeNull(); // Not an instance of Number
      expect(five.lookup).toContain('Number'); // But Number in lookup chain
      // This teaches automatic boxing during property access
    });

    it('reveals the null typeof quirk clearly', () => {
      const nullValue = representValue(null, 'full');
      expect(nullValue.type).toBe('object'); // typeof quirk
      expect(nullValue.instance).toBeNull(); // But not an instance of Object
      expect(nullValue.lookup).toEqual([]); // No prototype chain
      // All three fields together tell the complete story
    });

    it('shows Object.create(null) has no prototype', () => {
      const nullProto = Object.create(null);
      const result = representValue(nullProto, 'full');
      expect(result.type).toBe('object'); // It IS an object
      expect(result.instance).toBeNull(); // But no constructor
      expect(result.lookup).toEqual([]); // And no prototype chain
    });
  });

  describe('edge cases', () => {
    it('circular references should be handled', () => {
      const circular: any = { a: 1 };
      circular.self = circular;

      const result = representValue(circular, 'full');
      expect(result.type).toBe('object');
      expect(result.instance).toBe('Object');
      // Deep clone should handle circular reference
      expect(result.value.self).toBe('[Circular Reference]');
    });

    it('very long function should truncate preview at first line', () => {
      const veryLong = new Function(
        'x',
        'y',
        'z',
        'return x + y + z + x + y + z + x + y + z + x + y + z',
      );
      const result = representValue(veryLong, 'full');
      expect(result.value.preview).toMatch(/^function anonymous\(/);
    });

    it('Promise object (not thenable detection)', () => {
      const promise = Promise.resolve(42);
      const result = representValue(promise, 'full');
      expect(result.type).toBe('object');
      expect(result.lookup).toEqual(['Promise', 'Object', 'null']);
      expect(result.instance).toBe('Promise');
    });
  });
});
