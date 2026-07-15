import type { Node } from 'acorn';
import { describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';
import type { Snippet } from '../../../../embody/types.js';
import descendIdentifiers from '../context/descend-identifiers.js';
import type {
	IdentifierAnchor,
	PropertyAccessAnchor,
} from '../context/types.js';

function astOf(snippet: Snippet): Node {
	return snippet.raw.ast as unknown as Node;
}

function anchorsOf(code: string): readonly IdentifierAnchor[] {
	return descendIdentifiers(astOf(embody(code))).identifierAnchors;
}

function propertyAnchorsOf(code: string): readonly PropertyAccessAnchor[] {
	return descendIdentifiers(astOf(embody(code))).propertyAccessAnchors;
}

describe('descendIdentifiers', () => {
	describe('Zero', () => {
		it('returns no anchors for an empty program', () => {
			expect(anchorsOf('')).toEqual([]);
		});

		it('returns no anchors for a literal-only expression', () => {
			expect(anchorsOf('1 + 2;')).toEqual([]);
		});
	});

	describe('One', () => {
		it('emits a single read anchor for a lone reference', () => {
			expect(anchorsOf('x;').map((anchor) => anchor.usageKind)).toEqual([
				'read',
			]);
		});

		it('names the read anchor after the identifier', () => {
			expect(anchorsOf('x;').map((anchor) => anchor.name)).toEqual(['x']);
		});

		it('ranges the read anchor to the identifier span', () => {
			expect(anchorsOf('x;')[0]?.range).toEqual([0, 1]);
		});

		it('emits a single declared anchor for a declaration', () => {
			expect(anchorsOf('let x = 1;').map((anchor) => anchor.usageKind)).toEqual(
				['declared'],
			);
		});

		it('ranges the declared anchor to the binding id, not the initializer', () => {
			expect(anchorsOf('let x = 1;')[0]?.range).toEqual([4, 5]);
		});
	});

	describe('Many', () => {
		it('emits declared then read for a declaration and its later reference', () => {
			expect(
				anchorsOf('let x = 1; x;').map((anchor) => anchor.usageKind),
			).toEqual(['declared', 'read']);
		});

		it('preserves source order across multiple bindings', () => {
			expect(
				anchorsOf('let a = 1; let b = 2; a; b;').map((anchor) => anchor.name),
			).toEqual(['a', 'b', 'a', 'b']);
		});

		it('reads a variable referenced in an initializer', () => {
			expect(anchorsOf('let y = x;').map((anchor) => anchor.usageKind)).toEqual(
				['declared', 'read'],
			);
		});

		it('names both the declared binding and its initializer reference', () => {
			expect(anchorsOf('let y = x;').map((anchor) => anchor.name)).toEqual([
				'y',
				'x',
			]);
		});
	});

	describe('Boundaries — usage kinds', () => {
		it('marks a simple assignment target as assigned', () => {
			expect(
				anchorsOf('let x = 1; x = 2;').map((anchor) => anchor.usageKind),
			).toEqual(['declared', 'assigned']);
		});

		it('marks a compound assignment target as read-and-assigned', () => {
			expect(
				anchorsOf('let x = 1; x += 2;').map((anchor) => anchor.usageKind),
			).toEqual(['declared', 'read-and-assigned']);
		});

		it('marks a postfix update as read-and-assigned', () => {
			expect(
				anchorsOf('let x = 1; x++;').map((anchor) => anchor.usageKind),
			).toEqual(['declared', 'read-and-assigned']);
		});

		it('marks a prefix update as read-and-assigned', () => {
			expect(
				anchorsOf('let x = 1; ++x;').map((anchor) => anchor.usageKind),
			).toEqual(['declared', 'read-and-assigned']);
		});

		it('ranges an assignment-target anchor to the identifier, not the expression', () => {
			expect(anchorsOf('let x = 1; x = 2;')[1]?.range).toEqual([11, 12]);
		});

		it('declares the iteration variable and reads the iterable in a for-of', () => {
			expect(
				anchorsOf('let xs = 1; for (const x of xs) { x; }').map(
					(anchor) => anchor.usageKind,
				),
			).toEqual(['declared', 'declared', 'read', 'read']);
		});

		it('orders for-of anchors as outer binding, iteration variable, iterable, body', () => {
			expect(
				anchorsOf('let xs = 1; for (const x of xs) { x; }').map(
					(anchor) => anchor.name,
				),
			).toEqual(['xs', 'x', 'xs', 'x']);
		});
	});

	describe('Boundaries — the FLAG (non-reference positions excluded)', () => {
		it('excludes a non-computed member property name', () => {
			expect(anchorsOf('o.x;').map((anchor) => anchor.name)).toEqual(['o']);
		});

		it('reads the object of a member expression', () => {
			expect(anchorsOf('o.x;').map((anchor) => anchor.usageKind)).toEqual([
				'read',
			]);
		});

		it('reads the object of a member expression even when the member is an assignment target', () => {
			expect(anchorsOf('o.x = 1;').map((anchor) => anchor.usageKind)).toEqual([
				'read',
			]);
		});

		it('includes a computed member property as a read', () => {
			expect(anchorsOf('o[k];').map((anchor) => anchor.name)).toEqual([
				'o',
				'k',
			]);
		});

		it('excludes a non-computed object-literal key', () => {
			expect(
				anchorsOf('let p = { x: 1 };').map((anchor) => anchor.name),
			).toEqual(['p']);
		});

		it('includes a computed object-literal key as a read', () => {
			expect(
				anchorsOf('let k = 1; let p = { [k]: 2 };').map(
					(anchor) => anchor.name,
				),
			).toEqual(['k', 'p', 'k']);
		});
	});

	describe('Property-access stream (non-computed member properties)', () => {
		it('emits the property name of a non-computed member access', () => {
			expect(propertyAnchorsOf('o.x;')).toEqual([{ range: [2, 3], name: 'x' }]);
		});

		it('emits a multi-character property name with its own span', () => {
			expect(propertyAnchorsOf('str.length;')).toEqual([
				{ range: [4, 10], name: 'length' },
			]);
		});

		it('emits anchors for multiple independent member accesses in source order', () => {
			expect(propertyAnchorsOf('o.x; p.y;')).toEqual([
				{ range: [2, 3], name: 'x' },
				{ range: [7, 8], name: 'y' },
			]);
		});

		it('emits nothing for a computed member property (it is a scope-chain ref)', () => {
			expect(propertyAnchorsOf('o[k];')).toEqual([]);
		});

		it('emits nothing for a non-computed object-literal key', () => {
			expect(propertyAnchorsOf('let p = { x: 1 };')).toEqual([]);
		});

		it('emits each property in a nested member chain in source order', () => {
			expect(propertyAnchorsOf('a.b.c;')).toEqual([
				{ range: [2, 3], name: 'b' },
				{ range: [4, 5], name: 'c' },
			]);
		});

		it('keeps the two streams disjoint — the object stays in identifierAnchors only', () => {
			expect(anchorsOf('a.b.c;').map((anchor) => anchor.name)).toEqual(['a']);
			expect(propertyAnchorsOf('a.b.c;').map((anchor) => anchor.name)).toEqual([
				'b',
				'c',
			]);
		});

		it('keeps the streams independently ordered across a mixed program', () => {
			expect(anchorsOf('a.b; c;').map((anchor) => anchor.name)).toEqual([
				'a',
				'c',
			]);
			expect(propertyAnchorsOf('a.b; c;').map((anchor) => anchor.name)).toEqual(
				['b'],
			);
		});

		it('emits the dot-property anchor after a computed member in a chain', () => {
			expect(propertyAnchorsOf('o[k].x;')).toEqual([
				{ range: [5, 6], name: 'x' },
			]);
			expect(anchorsOf('o[k].x;').map((anchor) => anchor.name)).toEqual([
				'o',
				'k',
			]);
		});

		it('emits the property anchor even when the member is an assignment target', () => {
			expect(propertyAnchorsOf('o.x = 1;')).toEqual([
				{ range: [2, 3], name: 'x' },
			]);
		});

		it('emits nothing when there is no member access', () => {
			expect(propertyAnchorsOf('let x = 1; x;')).toEqual([]);
		});
	});

	describe('Interfaces', () => {
		it('returns anchors carrying range, name, and usageKind', () => {
			expect(anchorsOf('x;')[0]).toEqual({
				range: [0, 1],
				name: 'x',
				usageKind: 'read',
			});
		});

		it('returns property-access anchors carrying range and name only', () => {
			const anchor = propertyAnchorsOf('o.x;')[0];
			expect(anchor).toEqual({ range: [2, 3], name: 'x' });
			expect(anchor).not.toHaveProperty('usageKind');
		});
	});

	describe('Simple', () => {
		it('is deterministic across repeated descents of the same AST', () => {
			const ast = astOf(embody('o.x; let y = 1; y;'));
			expect(descendIdentifiers(ast)).toEqual(descendIdentifiers(ast));
		});
	});
});
