import createPureOperationEvent from '../../operators/pure.js';

describe('createPureOperationEvent', () => {
  describe('event structure', () => {
    describe('basic fields', () => {
      it('category = "operator"', () => {
        const event = createPureOperationEvent(
          { operator: '+', operands: [5, 5], result: 10 },
          { data: 'full', coercion: true },
        );
        expect(event.category).toBe('operator');
      });

      it('kind = "pure"', () => {
        const event = createPureOperationEvent(
          { operator: '+', operands: [5, 5], result: 10 },
          { data: 'full', coercion: true },
        );
        expect(event.kind).toBe('pure');
      });

      it('operator preserved from input', () => {
        const event = createPureOperationEvent(
          { operator: '+', operands: [5, 5], result: 10 },
          { data: 'full', coercion: true },
        );
        expect(event.operator).toBe('+');
      });
    });

    describe('four-field value structure', () => {
      describe('operands', () => {
        it('each operand has type field', () => {
          const event = createPureOperationEvent(
            { operator: '+', operands: [5, 'hello'], result: '5hello' },
            { data: 'full', coercion: true },
          );
          for (const op of event.operands) {
            expect(op).toHaveProperty('type');
          }
        });

        it('each operand has value field', () => {
          const event = createPureOperationEvent(
            { operator: '+', operands: [5, 'hello'], result: '5hello' },
            { data: 'full', coercion: true },
          );
          for (const op of event.operands) {
            expect(op).toHaveProperty('value');
          }
        });

        it('each operand has lookup field', () => {
          const event = createPureOperationEvent(
            { operator: '+', operands: [5, 'hello'], result: '5hello' },
            { data: 'full', coercion: true },
          );
          for (const op of event.operands) {
            expect(op).toHaveProperty('lookup');
          }
        });

        it('each operand has instance field', () => {
          const event = createPureOperationEvent(
            { operator: '+', operands: [5, 'hello'], result: '5hello' },
            { data: 'full', coercion: true },
          );
          for (const op of event.operands) {
            expect(op).toHaveProperty('instance');
          }
        });
      });

      describe('result', () => {
        it('has type field', () => {
          const event = createPureOperationEvent(
            { operator: '+', operands: [5, 'hello'], result: '5hello' },
            { data: 'full', coercion: true },
          );
          expect(event.result).toHaveProperty('type');
        });

        it('has value field', () => {
          const event = createPureOperationEvent(
            { operator: '+', operands: [5, 'hello'], result: '5hello' },
            { data: 'full', coercion: true },
          );
          expect(event.result).toHaveProperty('value');
        });

        it('has lookup field', () => {
          const event = createPureOperationEvent(
            { operator: '+', operands: [5, 'hello'], result: '5hello' },
            { data: 'full', coercion: true },
          );
          expect(event.result).toHaveProperty('lookup');
        });

        it('has instance field', () => {
          const event = createPureOperationEvent(
            { operator: '+', operands: [5, 'hello'], result: '5hello' },
            { data: 'full', coercion: true },
          );
          expect(event.result).toHaveProperty('instance');
        });
      });
    });
  });

  describe('value representation', () => {
    describe('primitive operands', () => {
      it('number operand → full representation', () => {
        const event = createPureOperationEvent(
          { operator: '+', operands: [5, 'hello'], result: '5hello' },
          { data: 'full', coercion: true },
        );
        expect(event.operands[0]).toEqual({
          type: 'number',
          value: 5,
          lookup: ['Number', 'Object', 'null'],
          instance: null,
        });
      });

      it('string operand → full representation', () => {
        const event = createPureOperationEvent(
          { operator: '+', operands: [5, 'hello'], result: '5hello' },
          { data: 'full', coercion: true },
        );
        expect(event.operands[1]).toEqual({
          type: 'string',
          value: 'hello',
          lookup: ['String', 'Object', 'null'],
          instance: null,
        });
      });

      it('string result → full representation', () => {
        const event = createPureOperationEvent(
          { operator: '+', operands: [5, 'hello'], result: '5hello' },
          { data: 'full', coercion: true },
        );
        expect(event.result).toEqual({
          type: 'string',
          value: '5hello',
          lookup: ['String', 'Object', 'null'],
          instance: null,
        });
      });
    });

    describe('object operands', () => {
      it('array operand type = "object"', () => {
        const event = createPureOperationEvent(
          { operator: '+', operands: [[], []], result: '' },
          { data: 'full', coercion: true },
        );
        expect(event.operands[0].type).toBe('object');
      });

      it('array operand instance = "Array"', () => {
        const event = createPureOperationEvent(
          { operator: '+', operands: [[], []], result: '' },
          { data: 'full', coercion: true },
        );
        expect(event.operands[0].instance).toBe('Array');
      });

      it('array operand lookup chain', () => {
        const event = createPureOperationEvent(
          { operator: '+', operands: [[], []], result: '' },
          { data: 'full', coercion: true },
        );
        expect(event.operands[0].lookup).toEqual(['Array', 'Object', 'null']);
      });
    });

    describe('special values', () => {
      it('null operand → full representation', () => {
        const event = createPureOperationEvent(
          { operator: '==', operands: [null, undefined], result: true },
          { data: 'full', coercion: true },
        );
        expect(event.operands[0]).toEqual({
          type: 'object',
          value: null,
          lookup: [],
          instance: null,
        });
      });

      it('undefined operand → full representation', () => {
        const event = createPureOperationEvent(
          { operator: '==', operands: [null, undefined], result: true },
          { data: 'full', coercion: true },
        );
        expect(event.operands[1]).toEqual({
          type: 'undefined',
          value: undefined,
          lookup: [],
          instance: null,
        });
      });

      it('boolean result → full representation', () => {
        const event = createPureOperationEvent(
          { operator: '==', operands: [null, undefined], result: true },
          { data: 'full', coercion: true },
        );
        expect(event.result).toEqual({
          type: 'boolean',
          value: true,
          lookup: ['Boolean', 'Object', 'null'],
          instance: null,
        });
      });
    });
  });

  describe('coercion field', () => {
    describe('string concatenation coercion', () => {
      it('coercion field is defined', () => {
        const event = createPureOperationEvent(
          { operator: '+', operands: [5, 'hello'], result: '5hello' },
          { data: 'full', coercion: true },
        );
        expect(event.coercion).toBeDefined();
      });

      it('number coerced to string', () => {
        const event = createPureOperationEvent(
          { operator: '+', operands: [5, 'hello'], result: '5hello' },
          { data: 'full', coercion: true },
        );
        expect(event.coercion[0]).toEqual({
          type: 'string',
          value: '5',
          lookup: ['String', 'Object', 'null'],
          instance: null,
        });
      });

      it('string unchanged in coercion', () => {
        const event = createPureOperationEvent(
          { operator: '+', operands: [5, 'hello'], result: '5hello' },
          { data: 'full', coercion: true },
        );
        expect(event.coercion[1]).toEqual({
          type: 'string',
          value: 'hello',
          lookup: ['String', 'Object', 'null'],
          instance: null,
        });
      });
    });

    describe('no-coercion case', () => {
      it('coercion field present even when values unchanged', () => {
        const event = createPureOperationEvent(
          { operator: '+', operands: [5, 5], result: 10 },
          { data: 'full', coercion: true },
        );
        expect(event.coercion).toBeDefined();
      });

      it('first operand unchanged in coercion array', () => {
        const event = createPureOperationEvent(
          { operator: '+', operands: [5, 5], result: 10 },
          { data: 'full', coercion: true },
        );
        expect(event.coercion[0]).toEqual({
          type: 'number',
          value: 5,
          lookup: ['Number', 'Object', 'null'],
          instance: null,
        });
      });

      it('second operand unchanged in coercion array', () => {
        const event = createPureOperationEvent(
          { operator: '+', operands: [5, 5], result: 10 },
          { data: 'full', coercion: true },
        );
        expect(event.coercion[1]).toEqual({
          type: 'number',
          value: 5,
          lookup: ['Number', 'Object', 'null'],
          instance: null,
        });
      });
    });

    describe('abstract equality coercion', () => {
      it('coercion field defined', () => {
        const event = createPureOperationEvent(
          { operator: '==', operands: [5, '5'], result: true },
          { data: 'full', coercion: true },
        );
        expect(event.coercion).toBeDefined();
      });

      it('number operand unchanged', () => {
        const event = createPureOperationEvent(
          { operator: '==', operands: [5, '5'], result: true },
          { data: 'full', coercion: true },
        );
        expect(event.coercion[0]).toEqual({
          type: 'number',
          value: 5,
          lookup: ['Number', 'Object', 'null'],
          instance: null,
        });
      });

      it('string coerced to number', () => {
        const event = createPureOperationEvent(
          { operator: '==', operands: [5, '5'], result: true },
          { data: 'full', coercion: true },
        );
        expect(event.coercion[1]).toEqual({
          type: 'number',
          value: 5,
          lookup: ['Number', 'Object', 'null'],
          instance: null,
        });
      });
    });

    describe('strict equality (no coercion)', () => {
      it('coercion field defined', () => {
        const event = createPureOperationEvent(
          { operator: '===', operands: [5, '5'], result: false },
          { data: 'full', coercion: true },
        );
        expect(event.coercion).toBeDefined();
      });

      it('number operand unchanged', () => {
        const event = createPureOperationEvent(
          { operator: '===', operands: [5, '5'], result: false },
          { data: 'full', coercion: true },
        );
        expect(event.coercion[0]).toEqual({
          type: 'number',
          value: 5,
          lookup: ['Number', 'Object', 'null'],
          instance: null,
        });
      });

      it('string operand unchanged', () => {
        const event = createPureOperationEvent(
          { operator: '===', operands: [5, '5'], result: false },
          { data: 'full', coercion: true },
        );
        expect(event.coercion[1]).toEqual({
          type: 'string',
          value: '5',
          lookup: ['String', 'Object', 'null'],
          instance: null,
        });
      });
    });
  });

  describe('various operators', () => {
    describe('unary operator (typeof)', () => {
      it('operator = "typeof"', () => {
        const event = createPureOperationEvent(
          { operator: 'typeof', operands: ['hello'], result: 'string' },
          { data: 'full', coercion: true },
        );
        expect(event.operator).toBe('typeof');
      });

      it('operands.length = 1', () => {
        const event = createPureOperationEvent(
          { operator: 'typeof', operands: ['hello'], result: 'string' },
          { data: 'full', coercion: true },
        );
        expect(event.operands.length).toBe(1);
      });

      it('result.value = "string"', () => {
        const event = createPureOperationEvent(
          { operator: 'typeof', operands: ['hello'], result: 'string' },
          { data: 'full', coercion: true },
        );
        expect(event.result.value).toBe('string');
      });

      it('coercion defined', () => {
        const event = createPureOperationEvent(
          { operator: 'typeof', operands: ['hello'], result: 'string' },
          { data: 'full', coercion: true },
        );
        expect(event.coercion).toBeDefined();
      });

      it('coercion[0] = operand as-is', () => {
        const event = createPureOperationEvent(
          { operator: 'typeof', operands: ['hello'], result: 'string' },
          { data: 'full', coercion: true },
        );
        expect(event.coercion[0]).toEqual({
          type: 'string',
          value: 'hello',
          lookup: ['String', 'Object', 'null'],
          instance: null,
        });
      });
    });

    describe('binary arithmetic operator (-)', () => {
      it('operator = "-"', () => {
        const event = createPureOperationEvent(
          { operator: '-', operands: ['10', 5], result: 5 },
          { data: 'full', coercion: true },
        );
        expect(event.operator).toBe('-');
      });

      it('coercion defined', () => {
        const event = createPureOperationEvent(
          { operator: '-', operands: ['10', 5], result: 5 },
          { data: 'full', coercion: true },
        );
        expect(event.coercion).toBeDefined();
      });

      it('string coerced to number', () => {
        const event = createPureOperationEvent(
          { operator: '-', operands: ['10', 5], result: 5 },
          { data: 'full', coercion: true },
        );
        expect(event.coercion[0]).toEqual({
          type: 'number',
          value: 10,
          lookup: ['Number', 'Object', 'null'],
          instance: null,
        });
      });
    });

    describe('comparison operator (<)', () => {
      it('operator = "<"', () => {
        const event = createPureOperationEvent(
          { operator: '<', operands: ['10', 5], result: false },
          { data: 'full', coercion: true },
        );
        expect(event.operator).toBe('<');
      });

      it('result.value = false', () => {
        const event = createPureOperationEvent(
          { operator: '<', operands: ['10', 5], result: false },
          { data: 'full', coercion: true },
        );
        expect(event.result.value).toBe(false);
      });

      it('coercion defined', () => {
        const event = createPureOperationEvent(
          { operator: '<', operands: ['10', 5], result: false },
          { data: 'full', coercion: true },
        );
        expect(event.coercion).toBeDefined();
      });
    });

    describe('in operator', () => {
      it('operator = "in"', () => {
        const event = createPureOperationEvent(
          { operator: 'in', operands: [0, ['a', 'b']], result: true },
          { data: 'full', coercion: true },
        );
        expect(event.operator).toBe('in');
      });

      it('key coerced to string', () => {
        const event = createPureOperationEvent(
          { operator: 'in', operands: [0, ['a', 'b']], result: true },
          { data: 'full', coercion: true },
        );
        expect(event.coercion[0]).toEqual({
          type: 'string',
          value: '0',
          lookup: ['String', 'Object', 'null'],
          instance: null,
        });
      });

      it('object unchanged in coercion', () => {
        const event = createPureOperationEvent(
          { operator: 'in', operands: [0, ['a', 'b']], result: true },
          { data: 'full', coercion: true },
        );
        expect(event.coercion[1]).toEqual({
          type: 'object',
          value: ['a', 'b'],
          lookup: ['Array', 'Object', 'null'],
          instance: 'Array',
        });
      });
    });

    describe('instanceof operator', () => {
      it('operator = "instanceof"', () => {
        const event = createPureOperationEvent(
          { operator: 'instanceof', operands: [[], Array], result: true },
          { data: 'full', coercion: true },
        );
        expect(event.operator).toBe('instanceof');
      });

      it('result.value = true', () => {
        const event = createPureOperationEvent(
          { operator: 'instanceof', operands: [[], Array], result: true },
          { data: 'full', coercion: true },
        );
        expect(event.result.value).toBe(true);
      });

      it('coercion defined', () => {
        const event = createPureOperationEvent(
          { operator: 'instanceof', operands: [[], Array], result: true },
          { data: 'full', coercion: true },
        );
        expect(event.coercion).toBeDefined();
      });

      it('coercion.length = 2', () => {
        const event = createPureOperationEvent(
          { operator: 'instanceof', operands: [[], Array], result: true },
          { data: 'full', coercion: true },
        );
        expect(event.coercion.length).toBe(2);
      });
    });
  });

  describe('edge cases', () => {
    describe('empty operands', () => {
      it('operands = []', () => {
        const event = createPureOperationEvent(
          { operator: 'weird', operands: [], result: 'something' },
          { data: 'full', coercion: true },
        );
        expect(event.operands).toEqual([]);
      });

      it('coercion = []', () => {
        const event = createPureOperationEvent(
          { operator: 'weird', operands: [], result: 'something' },
          { data: 'full', coercion: true },
        );
        expect(event.coercion).toEqual([]);
      });
    });

    describe('NaN result', () => {
      it('result.type = "number"', () => {
        const event = createPureOperationEvent(
          { operator: '-', operands: ['not a number', 5], result: Number.NaN },
          { data: 'full', coercion: true },
        );
        expect(event.result.type).toBe('number');
      });

      it('result.value is NaN', () => {
        const event = createPureOperationEvent(
          { operator: '-', operands: ['not a number', 5], result: Number.NaN },
          { data: 'full', coercion: true },
        );
        expect(Number.isNaN(event.result.value)).toBe(true);
      });
    });

    describe('Infinity result', () => {
      it('full representation', () => {
        const event = createPureOperationEvent(
          { operator: '/', operands: [1, 0], result: Infinity },
          { data: 'full', coercion: true },
        );
        expect(event.result).toEqual({
          type: 'number',
          value: Infinity,
          lookup: ['Number', 'Object', 'null'],
          instance: null,
        });
      });
    });

    describe('function operands', () => {
      it('type = "function"', () => {
        const function_ = function test() {};
        const event = createPureOperationEvent(
          { operator: '+', operands: [function_, ''], result: 'function test() {}' },
          { data: 'full', coercion: true },
        );
        expect(event.operands[0].type).toBe('function');
      });

      it('instance = "Function"', () => {
        const function_ = function test() {};
        const event = createPureOperationEvent(
          { operator: '+', operands: [function_, ''], result: 'function test() {}' },
          { data: 'full', coercion: true },
        );
        expect(event.operands[0].instance).toBe('Function');
      });

      it('value.name = "test"', () => {
        const function_ = function test() {};
        const event = createPureOperationEvent(
          { operator: '+', operands: [function_, ''], result: 'function test() {}' },
          { data: 'full', coercion: true },
        );
        expect(event.operands[0].value.name).toBe('test');
      });

      it('value.preview matches function signature', () => {
        const function_ = function test() {};
        const event = createPureOperationEvent(
          { operator: '+', operands: [function_, ''], result: 'function test() {}' },
          { data: 'full', coercion: true },
        );
        expect(event.operands[0].value.preview).toBe('function test() { }');
      });
    });
  });
});
