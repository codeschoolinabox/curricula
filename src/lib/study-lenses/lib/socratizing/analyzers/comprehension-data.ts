/**
 * @file Comprehension analyzers for data types and literals.
 *
 * @remarks Questions about understanding literal values and types.
 */

import type { Node } from 'acorn';

import type { ScopeUsage } from '../../scoping/types.js';
import createCodeQuestion from '../create-code-question.js';
import extractLocation from '../extract-location.js';
import type { AnalyzerEntry, CodeQuestion } from '../types.js';

import getRecord from './get-record.js';

// ─── 1. literal-type ───────────────────────────────────────

function literalType(
	node: Node,
	_scope: ScopeUsage,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'Literal') {
		return null;
	}

	const { value } = getRecord(node);
	// Skip null (handled separately), regex, and bigint
	if (value === null || typeof value === 'object') {
		return null;
	}

	const typeOf = typeof value;

	return createCodeQuestion({
		id: 'literal-type',
		kind: 'comprehension',
		category: 'clarity',
		feature: 'data',
		levels: ['syntax'],
		location: extractLocation(node),
		nodeType: node.type,
		context: `A literal ${typeOf} value appears in the code.`,
		questions: [
			{
				register: 'pointed',
				text: `What is the type of this value? What is the value itself?`,
			},
		],
		block: [{ dimension: 'text-surface', level: 'atom' }],
		pbsi: ['implementation'],
		audiences: ['developers', 'computer'],
	});
}

// ─── 2. null-and-undefined ─────────────────────────────────

function nullAndUndefined(
	node: Node,
	_scope: ScopeUsage,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'Literal') {
		return null;
	}

	if (getRecord(node).value !== null) {
		return null;
	}

	return createCodeQuestion({
		id: 'null-and-undefined',
		kind: 'comprehension',
		category: 'clarity',
		feature: 'data',
		levels: ['semantics'],
		location: extractLocation(node),
		nodeType: node.type,
		context: 'The value null represents the intentional absence of a value.',
		questions: [
			{
				register: 'open',
				text: 'What is the difference between null and undefined in JavaScript?',
			},
			{
				register: 'pointed',
				text: 'Where does null come from in a typical JeJ program?',
				hints: ['Think about what prompt() returns when the user cancels.'],
			},
		],
		block: [{ dimension: 'execution', level: 'atom' }],
		pbsi: ['implementation', 'behavior'],
		audiences: ['developers', 'computer'],
	});
}

// ─── Export ────────────────────────────────────────────────

const comprehensionDataAnalyzers: readonly AnalyzerEntry[] = [
	{ id: 'literal-type', analyze: literalType },
	{ id: 'null-and-undefined', analyze: nullAndUndefined },
];

export default comprehensionDataAnalyzers;
