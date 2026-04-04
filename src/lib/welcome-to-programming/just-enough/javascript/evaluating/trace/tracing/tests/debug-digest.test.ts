import { expect, it } from 'vitest';
import { parse } from 'acorn';
import { transpile, weaveFlexible, retropile } from 'aran';
import { generate } from 'astring';

import createAspect from '../weaving/create-aspect.js';

it('inspect digest callback arguments', () => {
	const code = 'let x = 5;\n';
	const ast = parse(code, {
		ecmaVersion: 2024,
		sourceType: 'script',
		locations: true,
	});

	const calls: Array<{
		nodeType: string;
		nodePath: string;
		filePath: string;
		nodeKind: string;
		hasLoc: boolean;
		loc: unknown;
		nodeKeys: string[];
	}> = [];

	const aranAST = transpile(
		{
			kind: 'eval',
			situ: { type: 'local', mode: 'strict' },
			root: ast,
			path: 'learner.js',
		},
		{
			global_declarative_record: 'builtin',
			digest: (node: any, nodePath: string, filePath: string, nodeKind: string) => {
				calls.push({
					nodeType: node?.type ?? 'unknown',
					nodePath,
					filePath,
					nodeKind,
					hasLoc: !!node?.loc,
					loc: node?.loc,
					nodeKeys: Object.keys(node ?? {}),
				});
				// Must return string|number
				return `${filePath}#${nodePath}`;
			},
		},
	);

	console.log('Total digest calls:', calls.length);
	for (let i = 0; i < Math.min(calls.length, 15); i++) {
		console.log(`Digest ${i}:`, JSON.stringify(calls[i]));
	}

	// Check if any node has loc
	const withLoc = calls.filter((c) => c.hasLoc);
	console.log('Nodes with loc:', withLoc.length, '/', calls.length);

	// Check node types seen
	const types = [...new Set(calls.map((c) => c.nodeType))];
	console.log('Node types:', types);

	// Check nodeKind values
	const kinds = [...new Set(calls.map((c) => c.nodeKind))];
	console.log('Node kinds:', kinds);

	expect(calls.length).toBeGreaterThan(0);
});
