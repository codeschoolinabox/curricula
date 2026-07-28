import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import deriveScopeUsage from '../derive-scope-usage.js';
import type { ScopeUsage } from '../types.js';

/**
 * Builds a REAL enriched environment from source (embody defaults to `module`)
 * and folds it — the same path production takes. No stub scope: these tests
 * assert the fold against eslint-scope's actual read/write classification.
 */
const scopeOf = (source: string): ScopeUsage => {
	const { environment } = embody(source).facts;
	if (!environment.ok) {
		throw new Error(environment.cause.message);
	}
	return deriveScopeUsage(environment.value);
};

const declarationNames = (source: string): readonly string[] =>
	scopeOf(source).allDeclarations.map((declaration) => declaration.name);

describe('deriveScopeUsage', () => {
	describe('Zero — nothing to report', () => {
		it('reports no declarations for an empty program', () => {
			expect(scopeOf('').allDeclarations).toEqual([]);
		});

		it('omits a lone var binding (not a let/const declaration)', () => {
			expect(scopeOf('var x = 1;').allDeclarations).toEqual([]);
		});

		it('omits an exported var — exported or not, the leaf reports let and const', () => {
			expect(declarationNames('export var v = 1;')).toEqual([]);
		});

		it('omits function and parameter bindings', () => {
			expect(scopeOf('function f(a) { return a; }').allDeclarations).toEqual(
				[],
			);
		});

		it('omits an imported binding (has a parent, but no let/const kind)', () => {
			expect(declarationNames("import { x } from './mod.js';")).toEqual([]);
		});
	});

	describe('One — a single binding', () => {
		it('reports a single const binding with zero counts', () => {
			const { allDeclarations } = scopeOf('const total = 1;');
			expect(allDeclarations).toHaveLength(1);
			expect(allDeclarations[0]).toMatchObject({
				name: 'total',
				kind: 'const',
				readCount: 0,
				writeCount: 0,
			});
		});

		it('reports a single let binding, initializer not counted as a write', () => {
			const { allDeclarations } = scopeOf('let count = 0;');
			expect(allDeclarations[0]).toMatchObject({
				name: 'count',
				kind: 'let',
				readCount: 0,
				writeCount: 0,
			});
		});
	});

	describe('Many — every let/const across the program', () => {
		it('reports each let/const binding in source order', () => {
			expect(declarationNames('const a = 1; let b = 2; const c = 3;')).toEqual([
				'a',
				'b',
				'c',
			]);
		});

		it('omits a var interleaved among let/const', () => {
			expect(declarationNames('const a = 1; var b = 2; let c = 3;')).toEqual([
				'a',
				'c',
			]);
		});

		it('reports a destructured binding like any other declaration', () => {
			// eslint-scope divergence from legacy build-scope: destructuring is
			// included (build-scope registered only plain-identifier declarations).
			expect(declarationNames('const { a } = {};')).toEqual(['a']);
		});
	});

	describe('Counts — the fold rule (eslint-scope classification)', () => {
		it('counts a later reassignment as one write', () => {
			const [usage] = scopeOf('let x = 1; x = 2;').allDeclarations;
			expect(usage).toMatchObject({ readCount: 0, writeCount: 1 });
		});

		it('counts every write when the declaration has no initializer', () => {
			// No init-flagged reference exists to exclude — forces a genuine
			// `!ref.init` filter, not a `writeRefs.length - 1` heuristic.
			const [usage] = scopeOf('let x; x = 1; x = 2;').allDeclarations;
			expect(usage).toMatchObject({ readCount: 0, writeCount: 2 });
		});

		it('counts each read of the binding', () => {
			const [x] = scopeOf('let x = 1; log(x); log(x);').allDeclarations;
			expect(x).toMatchObject({ readCount: 2, writeCount: 0 });
		});

		it('counts a compound assignment as one read and one write', () => {
			const [usage] = scopeOf('let x = 1; x += 1;').allDeclarations;
			expect(usage).toMatchObject({ readCount: 1, writeCount: 1 });
		});

		it('counts an update expression as one read and one write', () => {
			const [usage] = scopeOf('let x = 1; x++;').allDeclarations;
			expect(usage).toMatchObject({ readCount: 1, writeCount: 1 });
		});

		it('never counts the initializer as a write (a never-reassigned let is writeCount 0)', () => {
			const [usage] = scopeOf('let n = 5;').allDeclarations;
			expect(usage.writeCount).toBe(0);
		});

		it('counts a member-assignment target as a read of its object (eslint-scope-correct)', () => {
			// `obj.x = 5` reads `obj` to reach its property; the property, not the
			// binding, is written. Legacy build-scope counted this a write.
			const [object] = scopeOf('let obj = {}; obj.x = 5;').allDeclarations;
			expect(object).toMatchObject({
				name: 'obj',
				readCount: 1,
				writeCount: 0,
			});
		});
	});

	describe('Kind — let vs const', () => {
		it('reports declaration kind per binding', () => {
			const usages = scopeOf('const a = 1; let b = 2;').allDeclarations;
			expect(usages.map((usage) => usage.kind)).toEqual(['const', 'let']);
		});
	});

	describe('Shadowing — bindings stay distinct', () => {
		it('keeps an inner and outer same-name binding as separate usages', () => {
			const usages = scopeOf(
				'let x = 1; { let x = 2; x = 3; }',
			).allDeclarations;
			const xs = usages.filter((usage) => usage.name === 'x');
			expect(xs).toHaveLength(2);
			expect(
				xs.map((usage) => usage.writeCount).toSorted((a, b) => a - b),
			).toEqual([0, 1]);
		});
	});

	describe('Nested scopes — reported at every depth', () => {
		it('reports a const declared inside a block', () => {
			expect(declarationNames('{ const inner = 1; }')).toContain('inner');
		});

		it('reports a for-of loop binding', () => {
			expect(
				declarationNames('for (const item of []) { log(item); }'),
			).toContain('item');
		});

		it('reports a let declared inside a function body (domain-blind divergence)', () => {
			// build-scope modelled only program/block/for-of; the leaf is
			// domain-blind and reports function-scoped let/const too.
			expect(declarationNames('function f() { let x = 1; }')).toContain('x');
		});

		it('reports a doubly-nested declaration (Enumerate recurses, not one level)', () => {
			expect(declarationNames('{ if (true) { let deep = 1; } }')).toContain(
				'deep',
			);
		});
	});

	describe('Node identity — the declared identifier, by reference', () => {
		it('carries embody ScopeDefinition.name (=== the parsed identifier)', () => {
			const embodiment = embody('const x = 1;');
			const astStage = embodiment.facts.ast;
			const environmentStage = embodiment.facts.environment;
			if (!astStage.ok || !environmentStage.ok) {
				throw new Error('setup: facts did not derive');
			}
			const declaration = astStage.value.body[0];
			if (declaration.type !== 'VariableDeclaration') {
				throw new Error('setup: expected a VariableDeclaration');
			}
			const declaredIdentifier = declaration.declarations[0].id;
			const [usage] = deriveScopeUsage(environmentStage.value).allDeclarations;
			expect(usage.node).toBe(declaredIdentifier);
		});
	});

	describe('Exported — the module boundary', () => {
		it('leaves a purely local binding unexported', () => {
			const [usage] = scopeOf('const local = 1;').allDeclarations;
			expect(usage.exported).toBe(false);
		});

		it('marks a declaration export as exported', () => {
			const [usage] = scopeOf('export const config = 42;').allDeclarations;
			expect(usage.exported).toBe(true);
		});

		it('leaves a local binding unexported when a same-named re-export is present', () => {
			const [usage] = scopeOf(
				"const config = 1; export { config } from './m.js';",
			).allDeclarations;
			expect(usage.exported).toBe(false);
		});

		it('marks only the exported binding when a local one sits beside it', () => {
			const exported = scopeOf(
				'export const config = 42;\nconst scratch = 1;',
			).allDeclarations.find((declaration) => declaration.name === 'config');
			expect(exported?.exported).toBe(true);
		});

		it('leaves the local binding beside an exported one unexported', () => {
			const local = scopeOf(
				'export const config = 42;\nconst scratch = 1;',
			).allDeclarations.find((declaration) => declaration.name === 'scratch');
			expect(local?.exported).toBe(false);
		});

		it('marks an exported let as exported — the reduction is kind-blind', () => {
			const [usage] = scopeOf('export let mutable = 1;').allDeclarations;
			expect(usage.exported).toBe(true);
		});

		it('leaves a shadow of an exported name unexported — export is per binding', () => {
			const shadow = scopeOf('export const x = 1;\n{ const x = 2; }')
				.allDeclarations.filter((declaration) => declaration.name === 'x')
				.map((declaration) => declaration.exported);
			expect(shadow).toEqual([true, false]);
		});

		it('marks a binding exported by specifier as exported', () => {
			const [usage] = scopeOf(
				'const helper = 1; export { helper };',
			).allDeclarations;
			expect(usage.exported).toBe(true);
		});

		it('marks a renamed export as exported', () => {
			const [usage] = scopeOf(
				'const x = 1; export { x as y };',
			).allDeclarations;
			expect(usage.exported).toBe(true);
		});

		it('marks a default-exported binding as exported', () => {
			const [usage] = scopeOf('const x = 1; export default x;').allDeclarations;
			expect(usage.exported).toBe(true);
		});
	});

	describe('Immutability — deeply frozen output', () => {
		it('freezes the ScopeUsage, its list, and each VariableUsage', () => {
			const usage = scopeOf('const a = 1; let b = 2;');
			expect(usage.allDeclarations).toHaveLength(2); // guard the vacuous-undefined pass
			expect(Object.isFrozen(usage)).toBe(true);
			expect(Object.isFrozen(usage.allDeclarations)).toBe(true);
			expect(Object.isFrozen(usage.allDeclarations[0])).toBe(true);
		});
	});
});
