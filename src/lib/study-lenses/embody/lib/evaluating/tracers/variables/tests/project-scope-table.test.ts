import { parse } from 'acorn';
import type { Node } from 'acorn';
import { describe, it, expect } from 'vitest';

import buildScope from '../../../../scope/build-scope.js';
import projectScopeTable from '../project-scope-table.js';

function parseSource(source: string): Node {
	return parse(source, {
		ecmaVersion: 'latest',
		sourceType: 'module',
		locations: true,
	});
}

function project(source: string) {
	const ast = parseSource(source);
	return projectScopeTable(ast, buildScope(ast));
}

describe('projectScopeTable', () => {
	describe('empty program', () => {
		it('projects one script scope with no variables', () => {
			expect(project('')).toEqual({
				$: { scopeKind: 'script', variables: [] },
			});
		});
	});

	describe('single declaration', () => {
		it('projects the script scope with its one variable', () => {
			expect(project('let x;')).toEqual({
				$: { scopeKind: 'script', variables: [{ name: 'x', kind: 'let' }] },
			});
		});
	});

	describe('declaring block', () => {
		it('projects the script and block scopes under distinct node paths', () => {
			expect(project('let x; { let y; }')).toEqual({
				$: { scopeKind: 'script', variables: [{ name: 'x', kind: 'let' }] },
				'$.body.1': {
					scopeKind: 'block',
					variables: [{ name: 'y', kind: 'let' }],
				},
			});
		});
	});

	describe('multiple declarations', () => {
		it('projects them in source order with their kinds', () => {
			expect(project('const a = 1, b = 2; let c;')).toEqual({
				$: {
					scopeKind: 'script',
					variables: [
						{ name: 'a', kind: 'const' },
						{ name: 'b', kind: 'const' },
						{ name: 'c', kind: 'let' },
					],
				},
			});
		});
	});

	describe('sibling classic-for loops', () => {
		it('synthesizes a distinct for-scope per loop and leaves the script empty', () => {
			expect(
				project(
					'for (let i = 0; i < 2; i++) {} for (let i = 0; i < 2; i++) {}',
				),
			).toEqual({
				$: { scopeKind: 'script', variables: [] },
				'$.body.0': {
					scopeKind: 'for',
					variables: [{ name: 'i', kind: 'let' }],
				},
				'$.body.1': {
					scopeKind: 'for',
					variables: [{ name: 'i', kind: 'let' }],
				},
			});
		});
	});

	describe('for-head with multiple declarators', () => {
		it('lifts every head binding into the for-scope in order', () => {
			expect(project('for (let i = 0, j = 0; i < 2; i++) {}')).toEqual({
				$: { scopeKind: 'script', variables: [] },
				'$.body.0': {
					scopeKind: 'for',
					variables: [
						{ name: 'i', kind: 'let' },
						{ name: 'j', kind: 'let' },
					],
				},
			});
		});
	});

	describe('shadowing across scopes', () => {
		it('keeps each same-named binding under its own scope', () => {
			expect(project('let x; { let x; }')).toEqual({
				$: { scopeKind: 'script', variables: [{ name: 'x', kind: 'let' }] },
				'$.body.1': {
					scopeKind: 'block',
					variables: [{ name: 'x', kind: 'let' }],
				},
			});
		});
	});

	describe('empty-head classic-for', () => {
		it('synthesizes no for-scope', () => {
			expect(project('for (;;) {}')).toEqual({
				$: { scopeKind: 'script', variables: [] },
			});
		});
	});

	describe('assignment-head classic-for', () => {
		it('synthesizes no for-scope when the head is not a declaration', () => {
			expect(project('for (i = 0; i < 2; i++) {}')).toEqual({
				$: { scopeKind: 'script', variables: [] },
			});
		});
	});

	describe('declaration-less block', () => {
		it('drops the block, leaving only the script scope', () => {
			expect(project('if (true) {}')).toEqual({
				$: { scopeKind: 'script', variables: [] },
			});
		});
	});

	describe('block holding only a for-head', () => {
		it('drops the now-empty block after re-homing the head', () => {
			expect(project('{ for (let i = 0; i < 2; i++) {} }')).toEqual({
				$: { scopeKind: 'script', variables: [] },
				'$.body.0.body.0': {
					scopeKind: 'for',
					variables: [{ name: 'i', kind: 'let' }],
				},
			});
		});
	});

	describe('for-of with a declaring body', () => {
		it('merges head and body bindings into one for-of scope, head first', () => {
			expect(project('for (const x of y) { let z; }')).toEqual({
				$: { scopeKind: 'script', variables: [] },
				'$.body.0': {
					scopeKind: 'for-of',
					variables: [
						{ name: 'x', kind: 'const' },
						{ name: 'z', kind: 'let' },
					],
				},
			});
		});
	});

	describe('for-of with a non-declaring head', () => {
		it('projects only the body bindings into the for-of scope', () => {
			expect(project('let x; for (x of y) { let z; }')).toEqual({
				$: { scopeKind: 'script', variables: [{ name: 'x', kind: 'let' }] },
				'$.body.1': {
					scopeKind: 'for-of',
					variables: [{ name: 'z', kind: 'let' }],
				},
			});
		});
	});

	describe('nested classic-for loops', () => {
		it('synthesizes a for-scope at each loop and drops the bodies', () => {
			expect(
				project(
					'for (let i = 0; i < 2; i++) { for (let j = 0; j < 2; j++) {} }',
				),
			).toEqual({
				$: { scopeKind: 'script', variables: [] },
				'$.body.0': {
					scopeKind: 'for',
					variables: [{ name: 'i', kind: 'let' }],
				},
				'$.body.0.body.body.0': {
					scopeKind: 'for',
					variables: [{ name: 'j', kind: 'let' }],
				},
			});
		});
	});

	describe('frozen output', () => {
		it('deep-freezes the table', () => {
			expect(Object.isFrozen(project('let x;'))).toBe(true);
		});

		it('deep-freezes each variables array', () => {
			expect(Object.isFrozen(project('let x;')['$'].variables)).toBe(true);
		});
	});
});
