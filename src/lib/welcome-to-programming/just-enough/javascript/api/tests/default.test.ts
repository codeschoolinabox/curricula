import { describe, it, expect, vi } from 'vitest';

import { format } from '../format.js';

// WHY: run/trace/debug generators use Web Workers + DOM, unavailable in Node
vi.mock('../../evaluating/run/run.js', () => ({
	default: vi.fn(),
}));
vi.mock('../../evaluating/trace/record/record.js', () => ({
	default: vi.fn(),
}));
vi.mock('../../evaluating/debug/index.js', () => ({
	default: vi.fn(),
}));

import createJejProgram from '../default.js';

describe('createJejProgram', () => {
	describe('construction', () => {
		it('creates program with empty code by default', () => {
			const program = createJejProgram();
			expect(program.code).toBe('');
		});

		it('creates program with provided code', () => {
			const code = format('let x = 5;\n');
			const program = createJejProgram(code);
			expect(program.code).toBe(code);
		});

		it('never throws — even for invalid code', () => {
			expect(() => createJejProgram('for (;;) {}')).not.toThrow();
			expect(() => createJejProgram('let = ;')).not.toThrow();
		});
	});

	describe('ok property', () => {
		it('is true for empty program', () => {
			const program = createJejProgram();
			expect(program.ok).toBe(true);
		});

		it('is true for valid formatted JeJ', () => {
			const code = format('let x = 5;\n');
			const program = createJejProgram(code);
			expect(program.ok).toBe(true);
		});

		it('is false for non-JeJ code', () => {
			const program = createJejProgram('var x = 5;\n');
			expect(program.ok).toBe(false);
		});

		it('is false for parse errors', () => {
			const program = createJejProgram('let = ;');
			expect(program.ok).toBe(false);
		});

		it('is false for unformatted JeJ code', () => {
			const program = createJejProgram('let x=5;');
			expect(program.ok).toBe(false);
		});
	});

	describe('parseError property', () => {
		it('is undefined for valid code', () => {
			const code = format('let x = 5;\n');
			const program = createJejProgram(code);
			expect(program.parseError).toBeUndefined();
		});

		it('is SyntaxError for invalid syntax', () => {
			const program = createJejProgram('let = ;');
			expect(program.parseError).toBeInstanceOf(SyntaxError);
		});
	});

	describe('rejections property', () => {
		it('is empty for valid code', () => {
			const code = format('let x = 5;\n');
			const program = createJejProgram(code);
			expect(program.rejections).toEqual([]);
		});

		it('contains violations for non-JeJ code', () => {
			const program = createJejProgram('var x = 5;\n');
			expect(program.rejections.length).toBeGreaterThan(0);
		});
	});

	describe('isFormatted property', () => {
		it('is true for formatted code', () => {
			const code = format('let x = 5;\n');
			const program = createJejProgram(code);
			expect(program.isFormatted).toBe(true);
		});

		it('is false for unformatted code', () => {
			const program = createJejProgram('let x=5;');
			expect(program.isFormatted).toBe(false);
		});
	});

	describe('warnings property', () => {
		it('is an array for valid code', () => {
			const code = format('let x = 5;\n');
			const program = createJejProgram(code);
			expect(Array.isArray(program.warnings)).toBe(true);
		});

		it('is empty when code has rejections', () => {
			const program = createJejProgram('var x = 5;\n');
			expect(program.warnings).toEqual([]);
		});
	});

	describe('code setter', () => {
		it('updates code property', () => {
			const program = createJejProgram();
			const newCode = format('let x = 10;\n');
			program.code = newCode;
			expect(program.code).toBe(newCode);
		});

		it('re-runs analysis on set', () => {
			const program = createJejProgram(format('let x = 5;\n'));
			expect(program.ok).toBe(true);

			program.code = 'var x = 5;\n';
			expect(program.ok).toBe(false);
			expect(program.rejections.length).toBeGreaterThan(0);
		});

		it('never throws', () => {
			const program = createJejProgram();
			expect(() => {
				program.code = 'let = ;';
			}).not.toThrow();
			expect(program.ok).toBe(false);
		});

		it('updates immediately for shared references', () => {
			const program = createJejProgram(format('let x = 5;\n'));
			const ref = program;

			program.code = 'var x = 5;\n';
			expect(ref.ok).toBe(false);
		});
	});

	describe('execution blocked when !ok', () => {
		it('run returns error result when !ok', async () => {
			const program = createJejProgram('var x = 5;\n');
			const result = await program.run({ seconds: 5 });
			expect(result.ok).toBe(false);
		});

		it('trace returns error result when !ok', async () => {
			const program = createJejProgram('var x = 5;\n');
			const result = await program.trace({ seconds: 5 });
			expect(result.ok).toBe(false);
		});

		it('debug returns error result when !ok', async () => {
			const program = createJejProgram('var x = 5;\n');
			const result = await program.debug({ iterations: 100 });
			expect(result.ok).toBe(false);
		});

		it('blocked run yields no events', async () => {
			const program = createJejProgram('let = ;');
			const events: unknown[] = [];
			for await (const event of program.run({ seconds: 5 })) {
				events.push(event);
			}
			expect(events).toHaveLength(0);
		});

		it('blocked result is frozen', async () => {
			const program = createJejProgram('var x = 5;\n');
			const result = await program.run({ seconds: 5 });
			expect(Object.isFrozen(result)).toBe(true);
		});
	});

	describe('property assignment blocked', () => {
		it('rejects console.log = 5', () => {
			const program = createJejProgram('console.log = 5;\n');
			expect(program.ok).toBe(false);
			expect(program.rejections.length).toBeGreaterThan(0);
		});

		it('rejects obj.prop = value', () => {
			const program = createJejProgram('x.y = 5;\n');
			expect(program.ok).toBe(false);
			expect(program.rejections.length).toBeGreaterThan(0);
		});
	});
});
