import { describe, expect, it } from 'vitest';

import buildScope from '../../../../scope/build-scope.js';
import justEnoughJs from '../../../../validating/just-enough-js.js';
import validateProgram from '../../../../validating/validate-program.js';
import instrumentVariables from '../instrument-variables.js';
import projectScopeTable from '../project-scope-table.js';

function instrument(source: string): string {
	// Mirror production: the facade hands instrumentVariables the AST that
	// validateProgram produced (module mode, falling back to script for `with`).
	const { ast } = validateProgram(source, justEnoughJs);
	if (!ast) {
		throw new Error('fixture failed to parse');
	}
	const scopeTable = projectScopeTable(ast, buildScope(ast));
	return instrumentVariables(ast, source, scopeTable);
}

type RecordingDouble = {
	readonly log: string[];
	readonly open: (path: string) => void;
	readonly close: (path: string) => void;
	readonly abrupt: (reason: string) => void;
	readonly landed: () => void;
	readonly initialize: (
		path: string,
		name: string,
		value: unknown,
		explicit: boolean,
	) => unknown;
	readonly read: (path: string, name: string, thunk: () => unknown) => unknown;
	readonly assign: (
		path: string,
		name: string,
		operator: string,
		prior: () => unknown,
		writer: (incoming: unknown) => unknown,
		incoming?: unknown,
	) => unknown;
	readonly increment: (
		path: string,
		name: string,
		operator: string,
		form: string,
		prior: () => unknown,
		writer: () => unknown,
	) => unknown;
};

function createRecordingDouble(): RecordingDouble {
	const log: string[] = [];
	return {
		log,
		open(path) {
			log.push(`open:${path}`);
		},
		close(path) {
			log.push(`close:${path}`);
		},
		abrupt(reason) {
			log.push(`abrupt:${reason}`);
		},
		landed() {
			log.push('landed');
		},
		initialize(_path, name, value, explicit) {
			log.push(`init:${name}=${String(value)}:${explicit}`);
			return value;
		},
		read(_path, name, thunk) {
			log.push(`read:${name}`);
			return thunk();
		},
		assign(_path, name, operator, prior, writer, incoming) {
			log.push(`assign-enter:${name}:${operator}`);
			const priorValue = prior();
			log.push(`prior:${name}=${String(priorValue)}`);
			const nextValue = writer(incoming);
			log.push(`wrote:${name}=${String(nextValue)}`);
			return nextValue;
		},
		increment(_path, name, _operator, _form, prior, writer) {
			const priorValue = prior();
			log.push(`inc-prior:${name}=${String(priorValue)}`);
			const nextValue = writer();
			log.push(`inc-wrote:${name}=${String(nextValue)}`);
			return nextValue;
		},
	};
}

function run(source: string): readonly string[] {
	const double = createRecordingDouble();
	// eslint-disable-next-line @typescript-eslint/no-implied-eval, sonarjs/code-eval -- executing the instrumented output against a recording double is the ordering oracle
	new Function('__$vr', instrument(source))(double);
	return double.log;
}

describe('instrumentVariables', () => {
	describe('empty program', () => {
		it('wraps the script scope with open, try/catch/finally, and close', () => {
			expect(instrument('')).toBe(
				'__$vr.open("$"); try {} catch (__$e) { __$vr.abrupt("error"); throw __$e; } finally { __$vr.close("$"); }',
			);
		});
	});

	describe('a single declared read', () => {
		it('wraps the read as a thunk at its identifier path', () => {
			expect(instrument('let x = 1; x;')).toContain(
				'__$vr.read("$.body.1.expression", "x", () => x)',
			);
		});
	});

	describe('a declarator initializer', () => {
		it('wraps an explicit initializer eagerly', () => {
			expect(instrument('const x = 1;')).toContain(
				'__$vr.initialize("$.body.0.declarations.0", "x", (1), true)',
			);
		});

		it('inserts an initializer for the implicit let', () => {
			expect(instrument('let x;')).toContain(
				'x = __$vr.initialize("$.body.0.declarations.0", "x", undefined, false)',
			);
		});
	});

	describe('many declarators and reads', () => {
		it('wraps each declarator with its own path', () => {
			expect(instrument('let a = 1, b = 2;')).toContain(
				'__$vr.initialize("$.body.0.declarations.1", "b", (2), true)',
			);
		});

		it('wraps both operands of a nested binary read', () => {
			expect(instrument('let a = 1; let b = 2; a + b;')).toContain(
				'__$vr.read("$.body.2.expression.left", "a", () => a) + __$vr.read("$.body.2.expression.right", "b", () => b)',
			);
		});
	});

	describe('line fidelity', () => {
		it('preserves the original line count', () => {
			const source = 'let x = 1;\nlet y = 2;\nx;\n';
			const out = instrument(source);
			expect(out.split('\n')).toHaveLength(source.split('\n').length);
		});

		it('keeps same-line statements on their original line', () => {
			expect(instrument('let a = 1; a;').split('\n')).toHaveLength(1);
		});
	});

	describe('member expressions', () => {
		it('wraps the object as a read', () => {
			expect(instrument('let obj = "x"; obj.length;')).toContain(
				'__$vr.read("$.body.1.expression.object", "obj", () => obj).length',
			);
		});

		it('does not wrap a non-computed property name', () => {
			expect(
				instrument('let length = 1; let obj = "x"; obj.length;'),
			).toContain('() => obj).length');
		});

		it('wraps a computed property as a read', () => {
			expect(instrument('let obj = "x"; let k = "length"; obj[k];')).toContain(
				'__$vr.read("$.body.2.expression.property", "k", () => k)',
			);
		});
	});

	describe('exclusions', () => {
		it('does not read-wrap an update argument', () => {
			expect(instrument('let x = 0; x++;')).not.toContain('__$vr.read');
		});

		it('does not read-wrap an assignment target', () => {
			expect(instrument('let x = 0; x = 1;')).not.toContain('__$vr.read');
		});
	});

	describe('parenthesized reads (preserveParens)', () => {
		it('adds an .expression path segment for a single paren', () => {
			expect(instrument('let y = 1; let x = (y);')).toContain(
				'__$vr.read("$.body.1.declarations.0.init.expression", "y", () => y)',
			);
		});

		it('adds two .expression segments for double parens', () => {
			expect(instrument('let y = 1; let x = ((y));')).toContain(
				'"$.body.1.declarations.0.init.expression.expression"',
			);
		});
	});

	describe('assignment forms', () => {
		it('simple = passes the RHS eagerly as the trailing incoming', () => {
			expect(instrument('let x = 0; let y = 1; x = y;')).toContain(
				'__$vr.assign("$.body.2.expression", "x", "=", () => x, (__$vrIncoming) => (x = __$vrIncoming), (__$vr.read("$.body.2.expression.right", "y", () => y)))',
			);
		});

		it('compound runs the original expression in the writer thunk', () => {
			expect(instrument('let x = 0; let y = 1; x += y;')).toContain(
				'__$vr.assign("$.body.2.expression", "x", "+=", () => x, () => (x += __$vr.read("$.body.2.expression.right", "y", () => y)))',
			);
		});

		it('compound carries no incoming writer parameter', () => {
			expect(instrument('let x = 0; let y = 1; x += y;')).not.toContain(
				'(__$vrIncoming)',
			);
		});
	});

	describe('increment', () => {
		it('wraps an update expression with prior and writer thunks', () => {
			expect(instrument('let x = 0; x++;')).toContain(
				'__$vr.increment("$.body.1.expression", "x", "++", "postfix", () => x, () => x++)',
			);
		});

		it('reports the prefix form', () => {
			expect(instrument('let x = 0; --x;')).toContain(
				'"--", "prefix", () => x, () => --x)',
			);
		});
	});

	describe('scope wraps', () => {
		it('wraps a declaring block at its block path', () => {
			expect(instrument('{ let a = 1; }')).toContain('__$vr.open("$.body.0")');
		});

		it('does not wrap a non-declaring block', () => {
			expect(instrument('{ 1; }')).not.toContain('__$vr.open("$.body.0")');
		});

		it('wraps a classic for at its for path', () => {
			expect(instrument('for (let i = 0; i < 2; i++) {}')).toContain(
				'__$vr.open("$.body.0")',
			);
		});

		it('addresses a nested for by its own path', () => {
			expect(
				instrument(
					'for (let i = 0; i < 1; i++) { for (let j = 0; j < 1; j++) {} }',
				),
			).toContain('__$vr.open("$.body.0.body.body.0")');
		});

		it('initializes the for-of binding at body start', () => {
			expect(instrument('for (const c of "ab") {}')).toContain(
				'__$vr.initialize("$.body.0.left.declarations.0.id", "c", c, true)',
			);
		});

		it('addresses scopes by the scope-table keys', () => {
			expect(instrument('{ let a = 1; }')).toContain('__$vr.close("$.body.0")');
		});
	});

	describe('abrupt markers and landing', () => {
		it('marks a break before the statement', () => {
			expect(instrument('for (const c of "ab") { break; }')).toContain(
				'__$vr.abrupt("break"); break;',
			);
		});

		it('marks a continue before the statement', () => {
			expect(instrument('for (const c of "ab") { continue; }')).toContain(
				'__$vr.abrupt("continue"); continue;',
			);
		});

		it('clears the flag after a while loop', () => {
			expect(instrument('let i = 0; while (i < 2) { i++; }')).toContain(
				'__$vr.landed();',
			);
		});
	});

	describe('the public contract', () => {
		it('returns a string', () => {
			expect(typeof instrument('let x = 1;')).toBe('string');
		});
	});

	describe('rejected constructs', () => {
		it('throws on a labeled statement', () => {
			expect(() => instrument('loop: while (false) {}')).toThrow(
				'labeled statements',
			);
		});

		it('rejects a program using a labeled break (via its label)', () => {
			expect(() =>
				instrument('loop: for (const x of "ab") { break loop; }'),
			).toThrow('labeled statements');
		});

		it('throws on an expression-target for-of', () => {
			expect(() => instrument('let x; for (x of "ab") {}')).toThrow('for-of');
		});
	});

	describe('non-rejected constructs', () => {
		it('does not throw on a with statement', () => {
			expect(() => instrument('let o = "x"; with (o) {}')).not.toThrow();
		});

		it('does not throw on a sequence expression', () => {
			expect(() => instrument('let a = 1; let b = 2; (a, b);')).not.toThrow();
		});

		it('does not throw on optional chaining', () => {
			expect(() => instrument('let obj = "x"; obj?.length;')).not.toThrow();
		});

		it('wraps the object read inside an optional chain', () => {
			expect(instrument('let obj = "x"; obj?.length;')).toContain(
				'__$vr.read("$.body.1.expression.expression.object", "obj", () => obj)?.length',
			);
		});
	});

	describe('executed ordering', () => {
		it('simple = evaluates the RHS before reading the prior target', () => {
			const log = run('let x = 0; let y = 1; x = y;');
			expect(log.indexOf('read:y')).toBeLessThan(
				log.indexOf('assign-enter:x:='),
			);
		});

		it('compound reads the prior target before the RHS', () => {
			const log = run('let x = 0; let y = 1; x += y;');
			expect(log.indexOf('prior:x=0')).toBeLessThan(log.indexOf('read:y'));
		});

		it('||= with a truthy prior never invokes the RHS thunk', () => {
			const log = run('let x = 1; let y = 9; x ||= y;');
			expect(log).not.toContain('read:y');
		});

		it('??= with a non-nullish prior never invokes the RHS thunk', () => {
			const log = run('let x = 0; let y = 9; x ??= y;');
			expect(log).not.toContain('read:y');
		});

		it('&&= with a falsy prior never invokes the RHS thunk', () => {
			const log = run('let x = 0; let y = 9; x &&= y;');
			expect(log).not.toContain('read:y');
		});

		it('&&= with a truthy prior invokes the RHS thunk', () => {
			const log = run('let x = 1; let y = 9; x &&= y;');
			expect(log).toContain('read:y');
		});

		it('increment reads the prior value before writing', () => {
			const log = run('let x = 5; x++;');
			expect(log.indexOf('inc-prior:x=5')).toBeLessThan(
				log.indexOf('inc-wrote:x=5'),
			);
		});

		it('opens a block scope before initializing its binding', () => {
			const log = run('{ let a = 1; }');
			expect(log.indexOf('open:$.body.0')).toBeLessThan(
				log.indexOf('init:a=1:true'),
			);
		});

		it('closes a block scope after initializing its binding', () => {
			const log = run('{ let a = 1; }');
			expect(log.indexOf('init:a=1:true')).toBeLessThan(
				log.indexOf('close:$.body.0'),
			);
		});

		it('marks the abrupt break before closing the loop scope', () => {
			const log = run('for (const c of "ab") { break; }');
			expect(log.indexOf('abrupt:break')).toBeLessThan(
				log.indexOf('close:$.body.0'),
			);
		});

		it('lands after closing the loop scope on a break', () => {
			const log = run('for (const c of "ab") { break; }');
			expect(log.indexOf('close:$.body.0')).toBeLessThan(log.indexOf('landed'));
		});
	});
});
