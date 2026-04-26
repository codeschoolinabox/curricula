import { describe, it, expect } from 'vitest';

import parseProgram from '../../../../parse/parse-program.js';
import buildLocationIndex from '../build-location-index.js';
import link, { type EnrichedEvent } from '../link.js';
import type { ASTNode } from '../types.js';

function indexFor(source: string) {
	const program = parseProgram(source, 'module');
	if ('message' in program) {
		throw new Error(`fixture failed to parse: ${program.message}`);
	}
	return buildLocationIndex(program, source);
}

function fakeConsoleEvent(
	nodePath: string | null,
	line: number,
	column: number,
	source: 'exact' | 'enclosing-fallback' | 'no-ast',
): EnrichedEvent {
	return {
		event: 'console',
		method: 'log',
		args: [],
		line,
		column,
		nodePath,
		nodePathSource: source,
	} as unknown as EnrichedEvent;
}

describe('link', () => {
	describe('attaches .node ref', () => {
		it('per event, looked up via astByPath.get(nodePath)', () => {
			const index = indexFor('console.log(1);');
			const callPath = '$.body.0.expression';
			const event = fakeConsoleEvent(callPath, 1, 0, 'exact');

			const linked = link([event], index.astByPath);

			expect(linked[0].node).toBe(index.astByPath.get(callPath));
		});

		it('preserves event identity (no clone)', () => {
			const index = indexFor('console.log(1);');
			const event = fakeConsoleEvent('$.body.0.expression', 1, 0, 'exact');

			const linked = link([event], index.astByPath);

			expect(linked[0]).toBe(event);
		});
	});

	describe('back-refs', () => {
		it('pushes the linked event into ast[nodePath].events[]', () => {
			const index = indexFor('console.log(1);');
			const callPath = '$.body.0.expression';
			const event = fakeConsoleEvent(callPath, 1, 0, 'exact');

			link([event], index.astByPath);

			const node = index.astByPath.get(callPath)!;
			expect(node.events).toContain(event);
		});

		it('multiple events on the same node accumulate in order', () => {
			const index = indexFor('console.log(1);');
			const callPath = '$.body.0.expression';
			const e1 = fakeConsoleEvent(callPath, 1, 0, 'exact');
			const e2 = fakeConsoleEvent(callPath, 1, 0, 'exact');

			link([e1, e2], index.astByPath);

			const node = index.astByPath.get(callPath)!;
			expect(node.events).toEqual([e1, e2]);
		});
	});

	describe('no-ast events', () => {
		it('events with nodePath: null get node: null, no back-ref pushed', () => {
			const index = indexFor('let x = 1;');
			const event = fakeConsoleEvent(null, 0, 0, 'no-ast');

			const linked = link([event], index.astByPath);

			expect(linked[0].node).toBeNull();
			// No node received the back-ref
			for (const node of index.astByPath.values()) {
				expect((node.events as readonly unknown[])).not.toContain(event);
			}
		});
	});

	describe('defensive: unknown nodePath', () => {
		it('attaches node: null when astByPath has no entry for the path', () => {
			const index = indexFor('let x = 1;');
			const event = fakeConsoleEvent('$.does.not.exist', 1, 0, 'exact');

			const linked = link([event], index.astByPath);

			expect(linked[0].node).toBeNull();
		});
	});
});
