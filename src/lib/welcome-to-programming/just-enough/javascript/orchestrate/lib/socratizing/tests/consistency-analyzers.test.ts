import { describe, it, expect } from 'vitest';
import { parse } from 'acorn';
import type { Node } from 'acorn';

import buildScope from '../../../../embody/lib/scope/build-scope.js';

import consistencyAnalyzers from '../analyzers/consistency.js';
import type { CodeQuestion, ProgramAnalyzer } from '../types.js';

function parseSource(source: string): Node {
	return parse(source, {
		ecmaVersion: 'latest',
		sourceType: 'module',
		locations: true,
	});
}

function analyzeProgram(source: string, analyzerFn: ProgramAnalyzer): readonly CodeQuestion[] {
	const ast = parseSource(source);
	const scope = buildScope(ast);
	return analyzerFn(ast, scope, source);
}

function getAnalyzer(id: string): ProgramAnalyzer {
	const entry = consistencyAnalyzers.find((a) => a.id === id);
	if (!entry) {
		throw new Error(`Consistency analyzer '${id}' not found`);
	}
	return entry.analyze;
}

describe('consistency analyzers', () => {
	it('exports 4 analyzers', () => {
		expect(consistencyAnalyzers).toHaveLength(4);
	});

	describe('mixed-declaration-style', () => {
		const analyze = getAnalyzer('mixed-declaration-style');

		it('fires when program has const AND unreassigned let', () => {
			const results = analyzeProgram(
				'const name = "hello";\nlet count = 5;\nconsole.log(name, count);',
				analyze,
			);
			expect(results).toHaveLength(1);
			expect(results[0].category).toBe('consistency');
		});

		it('does not fire when all lets are reassigned', () => {
			const results = analyzeProgram(
				'const name = "hello";\nlet count = 0;\ncount = 5;\nconsole.log(name, count);',
				analyze,
			);
			expect(results).toHaveLength(0);
		});

		it('does not fire when only const is used', () => {
			const results = analyzeProgram(
				'const name = "hello";\nconst count = 5;',
				analyze,
			);
			expect(results).toHaveLength(0);
		});
	});

	describe('mixed-string-construction', () => {
		const analyze = getAnalyzer('mixed-string-construction');

		it('fires when program uses both template literals and concatenation', () => {
			const results = analyzeProgram(
				'const name = "world";\nconst greeting = `hello ${name}`;\nconst farewell = "bye " + name;',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire when only one style is used', () => {
			const results = analyzeProgram(
				'const name = "world";\nconst greeting = `hello ${name}`;\nconst farewell = `bye ${name}`;',
				analyze,
			);
			expect(results).toHaveLength(0);
		});
	});

	describe('mixed-equality', () => {
		const analyze = getAnalyzer('mixed-equality');

		it('fires when program uses both strict and loose equality', () => {
			const results = analyzeProgram(
				'const x = 5;\nconst a = x === 5;\nconst b = x == "5";',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire when only strict equality is used', () => {
			const results = analyzeProgram(
				'const x = 5;\nconst a = x === 5;\nconst b = x !== 3;',
				analyze,
			);
			expect(results).toHaveLength(0);
		});
	});

	describe('mixed-condition-style', () => {
		const analyze = getAnalyzer('mixed-condition-style');

		it('fires when program uses both truthy and explicit checks', () => {
			const results = analyzeProgram(
				'const input = prompt("test");\nif (input) { console.log(input); }\nif (input !== null) { console.log("not null"); }',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire when only explicit checks are used', () => {
			const results = analyzeProgram(
				'const input = prompt("test");\nif (input !== null) { console.log(input); }\nif (input !== "") { console.log("not empty"); }',
				analyze,
			);
			expect(results).toHaveLength(0);
		});
	});
});
