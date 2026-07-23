/**
 * @file Trap category analyzers (micro-decision).
 *
 * @remarks Trap analyzers detect patterns that are almost
 * certainly a bug. The questions help the reader notice
 * what they may have missed.
 */

import type { Node } from 'acorn';

import type { ScopeUsage } from '../../scoping/types.js';
import createCodeQuestion from '../create-code-question.js';
import extractLocation from '../extract-location.js';
import type { AnalyzerEntry, CodeQuestion } from '../types.js';

import getRecord from './get-record.js';

// ─── 1. constant-condition ─────────────────────────────────

function constantCondition(
	node: Node,
	_scope: ScopeUsage,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'IfStatement' && node.type !== 'WhileStatement') {
		return null;
	}

	const test = getRecord(node).test as Node;
	if (test.type !== 'Literal') {
		return null;
	}

	const statementType = node.type === 'IfStatement' ? 'if' : 'while';

	return createCodeQuestion({
		id: 'constant-condition',
		kind: 'micro-decision',
		category: 'trap',
		feature: 'controlFlow',
		levels: ['semantics'],
		location: extractLocation(node),
		nodeType: node.type,
		context:
			`The condition in this ${statementType} is a literal value that never changes. ` +
			`The **computer** always evaluates this the same way, which may not match the **purpose**.`,
		questions: [
			{
				register: 'open',
				text: `What does it mean when a ${statementType} condition can never change?`,
			},
			{
				register: 'pointed',
				text: 'Will the code inside this block always execute, or never?',
			},
		],
		block: [{ dimension: 'execution', level: 'atom' }],
		pbsi: ['implementation', 'behavior'],
		audiences: ['developers', 'computer'],
	});
}

// ─── 2. accidental-semicolon ───────────────────────────────

function accidentalSemicolon(
	node: Node,
	_scope: ScopeUsage,
	_source: string,
): CodeQuestion | null {
	if (
		node.type !== 'IfStatement' &&
		node.type !== 'WhileStatement' &&
		node.type !== 'ForOfStatement'
	) {
		return null;
	}

	const record = getRecord(node);
	const body =
		node.type === 'IfStatement'
			? (record.consequent as Node)
			: (record.body as Node);

	if (body.type !== 'EmptyStatement') {
		return null;
	}

	const statementLabels: Record<string, string> = {
		IfStatement: 'if',
		WhileStatement: 'while',
		ForOfStatement: 'for...of',
	};
	const statementType = statementLabels[node.type] ?? 'for...of';

	return createCodeQuestion({
		id: 'accidental-semicolon',
		kind: 'micro-decision',
		category: 'trap',
		feature: 'controlFlow',
		levels: ['syntax', 'semantics'],
		location: extractLocation(node),
		nodeType: node.type,
		context:
			`There is a semicolon immediately after this ${statementType}, creating an empty body. ` +
			`The **computer** executes the empty body, then the next block runs unconditionally.`,
		questions: [
			{
				register: 'open',
				text: `What code does this ${statementType} actually control?`,
			},
			{
				register: 'pointed',
				text: 'Is the semicolon after the condition intentional?',
			},
		],
		block: [
			{ dimension: 'text-surface', level: 'atom' },
			{ dimension: 'execution', level: 'block' },
		],
		pbsi: ['implementation'],
		audiences: ['developers', 'computer'],
	});
}

// ─── Export ────────────────────────────────────────────────

const trapAnalyzers: readonly AnalyzerEntry[] = [
	{ id: 'constant-condition', analyze: constantCondition },
	{ id: 'accidental-semicolon', analyze: accidentalSemicolon },
];

export default trapAnalyzers;
