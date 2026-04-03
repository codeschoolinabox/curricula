import { describe, it, expect } from 'vitest';
import { parse } from 'acorn';
import type { Node } from 'acorn';

import buildScope from '../build-scope.js';
import type { DeclarationInfo, ScopeAnalysis, ScopeInfo } from '../types.js';

// ─── Test helper ────────────────────────────────────────────

function parseSource(source: string): Node {
	return parse(source, {
		ecmaVersion: 'latest',
		sourceType: 'module',
		locations: true,
	});
}

/** Find a declaration by name in allDeclarations. */
function findDecl(
	analysis: ScopeAnalysis,
	name: string,
): DeclarationInfo | undefined {
	return analysis.allDeclarations.find((d) => d.name === name);
}

// ─── Tests ──────────────────────────────────────────────────

describe('buildScope', () => {
	describe('basic structure', () => {
		it('returns root scope for empty program', () => {
			const ast = parseSource('');
			const analysis = buildScope(ast);

			expect(analysis.root.kind).toBe('program');
			expect(analysis.root.parent).toBeNull();
			expect(analysis.root.children).toEqual([]);
			expect(analysis.root.declarations.size).toBe(0);
			expect(analysis.allDeclarations).toEqual([]);
		});

		it('result is deeply frozen', () => {
			const ast = parseSource('let x = 1;');
			const analysis = buildScope(ast);

			expect(Object.isFrozen(analysis)).toBe(true);
			expect(Object.isFrozen(analysis.root)).toBe(true);
			expect(Object.isFrozen(analysis.allDeclarations)).toBe(true);
		});
	});

	describe('declarations', () => {
		it('tracks a single let declaration', () => {
			const ast = parseSource('let x = 5;');
			const analysis = buildScope(ast);

			expect(analysis.allDeclarations).toHaveLength(1);
			const decl = findDecl(analysis, 'x')!;
			expect(decl).toBeDefined();
			expect(decl.kind).toBe('let');
			expect(decl.readCount).toBe(0);
			expect(decl.writeCount).toBe(0);
			expect(decl.scopeDepth).toBe(0);
		});

		it('tracks a single const declaration', () => {
			const ast = parseSource('const y = 10;');
			const analysis = buildScope(ast);

			const decl = findDecl(analysis, 'y')!;
			expect(decl.kind).toBe('const');
		});

		it('tracks the init node', () => {
			const ast = parseSource('let x = 5;');
			const analysis = buildScope(ast);

			const decl = findDecl(analysis, 'x')!;
			expect(decl.initNode).not.toBeNull();
			expect(decl.initNode!.type).toBe('Literal');
		});

		it('records null initNode for uninitialized let', () => {
			const ast = parseSource('let x;');
			const analysis = buildScope(ast);

			const decl = findDecl(analysis, 'x')!;
			expect(decl.initNode).toBeNull();
		});

		it('tracks multiple declarations', () => {
			const ast = parseSource('let a = 1;\nconst b = 2;\nlet c = 3;');
			const analysis = buildScope(ast);

			expect(analysis.allDeclarations).toHaveLength(3);
			expect(findDecl(analysis, 'a')!.kind).toBe('let');
			expect(findDecl(analysis, 'b')!.kind).toBe('const');
			expect(findDecl(analysis, 'c')!.kind).toBe('let');
		});

		it('registers declaration in root scope map', () => {
			const ast = parseSource('let x = 1;');
			const analysis = buildScope(ast);

			expect(analysis.root.declarations.has('x')).toBe(true);
			expect(analysis.root.declarations.get('x')!.name).toBe('x');
		});
	});

	describe('read references', () => {
		it('counts a single read', () => {
			const ast = parseSource('let x = 5;\nconsole.log(x);');
			const analysis = buildScope(ast);

			const decl = findDecl(analysis, 'x')!;
			expect(decl.readCount).toBe(1);
		});

		it('counts multiple reads', () => {
			const ast = parseSource('let x = 5;\nlet y = x;\nlet z = x;');
			const analysis = buildScope(ast);

			const decl = findDecl(analysis, 'x')!;
			expect(decl.readCount).toBe(2);
		});

		it('does not count the init expression as a read of the declared variable', () => {
			const ast = parseSource('let x = 5;');
			const analysis = buildScope(ast);

			expect(findDecl(analysis, 'x')!.readCount).toBe(0);
		});

		it('counts reads of a variable used in its own update', () => {
			const ast = parseSource('let x = 1;\nx = x + 1;');
			const analysis = buildScope(ast);

			// x on the right side of assignment is a read
			expect(findDecl(analysis, 'x')!.readCount).toBe(1);
		});

		it('does not count non-computed member property as a read', () => {
			const ast = parseSource('let x = 1;\nconsole.log(x);');
			const analysis = buildScope(ast);

			// 'log' is not a declared variable, but 'console' is not either
			// 'x' IS read (passed as argument)
			expect(findDecl(analysis, 'x')!.readCount).toBe(1);
		});
	});

	describe('write references', () => {
		it('counts a single reassignment', () => {
			const ast = parseSource('let x = 5;\nx = 10;');
			const analysis = buildScope(ast);

			expect(findDecl(analysis, 'x')!.writeCount).toBe(1);
		});

		it('counts multiple reassignments', () => {
			const ast = parseSource('let x = 0;\nx = 1;\nx = 2;\nx = 3;');
			const analysis = buildScope(ast);

			expect(findDecl(analysis, 'x')!.writeCount).toBe(3);
		});

		it('does not count the initial value as a write', () => {
			const ast = parseSource('let x = 5;');
			const analysis = buildScope(ast);

			expect(findDecl(analysis, 'x')!.writeCount).toBe(0);
		});

		it('counts compound assignment as a write and a read', () => {
			const ast = parseSource('let x = 1;\nx += 5;');
			const analysis = buildScope(ast);

			const decl = findDecl(analysis, 'x')!;
			expect(decl.writeCount).toBe(1);
			expect(decl.readCount).toBe(1);
		});
	});

	describe('block scopes', () => {
		it('creates a child scope for if body', () => {
			const ast = parseSource('if (true) { let y = 1; }');
			const analysis = buildScope(ast);

			expect(analysis.root.children).toHaveLength(1);
			const childScope = analysis.root.children[0];
			expect(childScope.kind).toBe('block');
			expect(childScope.parent).toBe(analysis.root);
			expect(childScope.declarations.has('y')).toBe(true);
		});

		it('creates child scopes for if/else', () => {
			const ast = parseSource(
				'if (true) { let a = 1; } else { let b = 2; }',
			);
			const analysis = buildScope(ast);

			expect(analysis.root.children).toHaveLength(2);
			expect(analysis.root.children[0].declarations.has('a')).toBe(true);
			expect(analysis.root.children[1].declarations.has('b')).toBe(true);
		});

		it('tracks scope depth correctly', () => {
			const ast = parseSource(
				'let a = 1;\nif (true) {\n  let b = 2;\n  if (true) {\n    let c = 3;\n  }\n}',
			);
			const analysis = buildScope(ast);

			expect(findDecl(analysis, 'a')!.scopeDepth).toBe(0);
			expect(findDecl(analysis, 'b')!.scopeDepth).toBe(1);
			expect(findDecl(analysis, 'c')!.scopeDepth).toBe(2);
		});

		it('resolves reads from outer scope through block boundaries', () => {
			const ast = parseSource('let x = 1;\nif (true) { console.log(x); }');
			const analysis = buildScope(ast);

			expect(findDecl(analysis, 'x')!.readCount).toBe(1);
		});

		it('resolves writes to outer scope through block boundaries', () => {
			const ast = parseSource('let x = 1;\nif (true) { x = 2; }');
			const analysis = buildScope(ast);

			expect(findDecl(analysis, 'x')!.writeCount).toBe(1);
		});

		it('does not leak block-scoped declarations to outer scope', () => {
			const ast = parseSource('if (true) { let y = 1; }');
			const analysis = buildScope(ast);

			// 'y' should NOT be in the root scope
			expect(analysis.root.declarations.has('y')).toBe(false);
			// But it IS in allDeclarations (flat view)
			expect(findDecl(analysis, 'y')).toBeDefined();
		});
	});

	describe('for-of scopes', () => {
		it('creates a for-of scope for the iterator variable', () => {
			const ast = parseSource(
				'const items = "hello";\nfor (const item of items) { }',
			);
			const analysis = buildScope(ast);

			const forOfScope = analysis.root.children[0];
			expect(forOfScope).toBeDefined();
			expect(forOfScope.kind).toBe('for-of');
			expect(forOfScope.declarations.has('item')).toBe(true);
		});

		it('iterator variable is const', () => {
			const ast = parseSource(
				'const items = "hello";\nfor (const item of items) { }',
			);
			const analysis = buildScope(ast);

			const decl = findDecl(analysis, 'item')!;
			expect(decl.kind).toBe('const');
		});

		it('iterator variable supports let', () => {
			const ast = parseSource(
				'const items = "hello";\nfor (let item of items) { }',
			);
			const analysis = buildScope(ast);

			const decl = findDecl(analysis, 'item')!;
			expect(decl.kind).toBe('let');
		});

		it('resolves right-hand side in parent scope', () => {
			const ast = parseSource(
				'const items = "hello";\nfor (const item of items) { }',
			);
			const analysis = buildScope(ast);

			// 'items' in the for-of right side is a read of the outer 'items'
			expect(findDecl(analysis, 'items')!.readCount).toBe(1);
		});

		it('counts reads of iterator variable inside body', () => {
			const ast = parseSource(
				'const items = "hello";\nfor (const item of items) {\n  console.log(item);\n}',
			);
			const analysis = buildScope(ast);

			expect(findDecl(analysis, 'item')!.readCount).toBe(1);
		});

		it('for-of body block does not create a separate child scope', () => {
			const ast = parseSource(
				'const items = "hello";\nfor (const item of items) { let x = 1; }',
			);
			const analysis = buildScope(ast);

			// The for-of scope IS the body scope — no extra nesting
			const forOfScope = analysis.root.children[0];
			expect(forOfScope.kind).toBe('for-of');
			expect(forOfScope.declarations.has('item')).toBe(true);
			expect(forOfScope.declarations.has('x')).toBe(true);
			// No grandchild scope for the block body
			expect(forOfScope.children).toHaveLength(0);
		});
	});

	describe('variable shadowing', () => {
		it('tracks shadowed variables as separate declarations', () => {
			const ast = parseSource(
				'let x = 1;\nif (true) { let x = 2; }',
			);
			const analysis = buildScope(ast);

			// Two separate declarations of 'x'
			const xs = analysis.allDeclarations.filter((d) => d.name === 'x');
			expect(xs).toHaveLength(2);
			expect(xs[0].scopeDepth).toBe(0);
			expect(xs[1].scopeDepth).toBe(1);
		});

		it('resolves references to the innermost declaration', () => {
			const ast = parseSource(
				'let x = 1;\nif (true) {\n  let x = 2;\n  console.log(x);\n}',
			);
			const analysis = buildScope(ast);

			const xs = analysis.allDeclarations.filter((d) => d.name === 'x');
			const outer = xs.find((d) => d.scopeDepth === 0)!;
			const inner = xs.find((d) => d.scopeDepth === 1)!;

			expect(inner.readCount).toBe(1);
			expect(outer.readCount).toBe(0);
		});
	});

	describe('while loops', () => {
		it('creates a block scope for while body', () => {
			const ast = parseSource(
				'let i = 0;\nwhile (i < 3) {\n  let x = i;\n  i = i + 1;\n}',
			);
			const analysis = buildScope(ast);

			expect(analysis.root.children).toHaveLength(1);
			expect(analysis.root.children[0].kind).toBe('block');
			expect(analysis.root.children[0].declarations.has('x')).toBe(true);
		});

		it('resolves condition reads to outer scope', () => {
			const ast = parseSource(
				'let i = 0;\nwhile (i < 3) {\n  i = i + 1;\n}',
			);
			const analysis = buildScope(ast);

			const decl = findDecl(analysis, 'i')!;
			// condition: i (read), body: i = i + 1 (write + read)
			expect(decl.readCount).toBe(2);
			expect(decl.writeCount).toBe(1);
		});
	});

	describe('complex programs', () => {
		it('handles a real JeJ program', () => {
			const source = [
				'let input = prompt("enter something:");',
				'let message = "";',
				'',
				'if (input === null) {',
				'  message = "you cancelled";',
				'} else if (input === "") {',
				'  message = "you entered nothing";',
				'} else {',
				'  message = "you entered: " + input;',
				'}',
				'',
				'alert(message);',
			].join('\n');

			const ast = parseSource(source);
			const analysis = buildScope(ast);

			const inputDecl = findDecl(analysis, 'input')!;
			const messageDecl = findDecl(analysis, 'message')!;

			expect(inputDecl.kind).toBe('let');
			expect(inputDecl.readCount).toBe(3); // 3 reads: null check, empty check, concatenation
			expect(inputDecl.writeCount).toBe(0);

			expect(messageDecl.kind).toBe('let');
			expect(messageDecl.readCount).toBe(1); // alert(message)
			expect(messageDecl.writeCount).toBe(3); // 3 branches assign to message
		});
	});

	describe('edge cases', () => {
		it('handles identifiers that do not resolve to any declaration', () => {
			const ast = parseSource('console.log("hello");');
			const analysis = buildScope(ast);

			// 'console' is not declared — should not throw
			expect(analysis.allDeclarations).toHaveLength(0);
		});

		it('handles ternary expressions with reads', () => {
			const ast = parseSource(
				'let x = true;\nlet y = x ? "yes" : "no";',
			);
			const analysis = buildScope(ast);

			expect(findDecl(analysis, 'x')!.readCount).toBe(1);
		});

		it('handles template literals with reads', () => {
			const ast = parseSource(
				'let name = "world";\nlet greeting = `hello ${name}`;',
			);
			const analysis = buildScope(ast);

			expect(findDecl(analysis, 'name')!.readCount).toBe(1);
		});

		it('handles nullish coalescing with reads', () => {
			const ast = parseSource(
				'let input = null;\nlet value = input ?? "default";',
			);
			const analysis = buildScope(ast);

			expect(findDecl(analysis, 'input')!.readCount).toBe(1);
		});
	});
});
