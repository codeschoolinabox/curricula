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

// ─── Helpers ───────────────────────────────────────────────

/**
 * Every statement that states a condition, named as a learner would say it.
 * Membership doubles as the type gate. Deliberately narrower than
 * `STATEMENT_LABELS`: `for...of` and `for...in` iterate rather than test, so they
 * carry no condition that could be constant.
 */
const CONDITION_LABELS: Readonly<Record<string, string>> = {
	IfStatement: 'if',
	WhileStatement: 'while',
	DoWhileStatement: 'do...while',
	ForStatement: 'for',
};

/**
 * Every statement whose body a stray semicolon can empty, named as a learner would
 * say it. Membership doubles as the type gate: a statement absent from this table
 * has no body a semicolon could swallow. `for...in` is admitted defensively, exactly
 * as `caution.ts`'s `LOOP_STATEMENTS` and `voice-profile.ts`'s loop set admit it —
 * the engine analyzes whatever parsed, not only what the JeJ level admits.
 */
const STATEMENT_LABELS: Readonly<Record<string, string>> = {
	IfStatement: 'if',
	WhileStatement: 'while',
	DoWhileStatement: 'do...while',
	ForStatement: 'for',
	ForOfStatement: 'for...of',
	ForInStatement: 'for...in',
};

// ─── 1. constant-condition ─────────────────────────────────

function constantCondition(
	node: Node,
	_scope: ScopeUsage,
	_source: string,
): CodeQuestion | null {
	// Load-bearing despite the type: `noUncheckedIndexedAccess` is off, so this
	// lookup is typed `string` and the compiler cannot see the miss.
	const statementType = CONDITION_LABELS[node.type];
	if (statementType === undefined) {
		return null;
	}

	// `for (;;)` states no condition at all — `test` is null, not a node.
	const test = getRecord(node).test as Node | null;
	if (test?.type !== 'Literal') {
		return null;
	}

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
	// Load-bearing despite the type: `noUncheckedIndexedAccess` is off, so this
	// lookup is typed `string` and the compiler cannot see the miss. Without the
	// check every node type would fall through to a body that is not there.
	const statementType = STATEMENT_LABELS[node.type];
	if (statementType === undefined) {
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
