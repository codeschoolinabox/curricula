/**
 * @file Clarity category analyzers (micro-decision).
 *
 * @remarks Clarity analyzers detect patterns that affect
 * readability or maintainability. These are not bugs — they
 * are choices that affect how easily a reader can understand
 * the code.
 */

import type { Node } from 'acorn';

import type { ScopeAnalysis } from '../../scope/types.js';

import createCodeQuestion from '../create-code-question.js';
import extractLocation from '../extract-location.js';

import type { AnalyzerEntry, CodeQuestion } from '../types.js';

import getRecord from './get-record.js';

// ─── 1. nested-conditions ──────────────────────────────────

function nestedConditions(
	node: Node,
	_scope: ScopeAnalysis,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'IfStatement') {
		return null;
	}

	const consequent = getRecord(node).consequent as Node;
	if (consequent.type !== 'BlockStatement') {
		return null;
	}

	const body = getRecord(consequent).body as Node[];
	const hasNestedIf = body.some((stmt) => stmt.type === 'IfStatement');
	if (!hasNestedIf) {
		return null;
	}

	return createCodeQuestion({
		id: 'nested-conditions',
		kind: 'micro-decision',
		category: 'clarity',
		feature: 'controlFlow',
		levels: ['semantics', 'connections'],
		location: extractLocation(node),
		nodeType: node.type,
		context:
			`This if-block contains another conditional inside it. ` +
			`This **strategy** choice creates multiple branching paths that a reader must follow.`,
		questions: [
			{
				register: 'open',
				text: 'How many different paths can this nested structure produce?',
			},
			{
				register: 'pointed',
				text: 'What happens when both conditions are true? When neither is?',
			},
		],
		block: [
			{ dimension: 'execution', level: 'block' },
			{ dimension: 'purpose', level: 'relation' },
		],
		pbsi: ['strategy'],
		audiences: ['developers'],
	});
}

// ─── 2. boolean-coercion ───────────────────────────────────

function booleanCoercion(
	node: Node,
	_scope: ScopeAnalysis,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'IfStatement' && node.type !== 'WhileStatement') {
		return null;
	}

	const test = getRecord(node).test as Node;

	// Direct identifier as condition: `if (x)`
	const isTruthyCheck =
		test.type === 'Identifier' ||
		(test.type === 'UnaryExpression' &&
			getRecord(test).operator === '!' &&
			(getRecord(test).argument as Node).type === 'Identifier');

	if (!isTruthyCheck) {
		return null;
	}

	return createCodeQuestion({
		id: 'boolean-coercion',
		kind: 'micro-decision',
		category: 'clarity',
		feature: 'controlFlow',
		levels: ['semantics'],
		location: extractLocation(node),
		nodeType: node.type,
		context:
			`The condition relies on JavaScript's truthy/falsy rules rather than an explicit comparison. ` +
			`This **implementation** choice assumes the reader knows which values are falsy.`,
		questions: [
			{
				register: 'open',
				text: 'What values would make this condition true? What values false?',
			},
			{
				register: 'pointed',
				text: 'Is the empty string truthy or falsy? What about 0? What about null?',
			},
			{
				register: 'comparative',
				text: 'How would an explicit comparison (e.g., !== null) change the meaning?',
			},
		],
		block: [
			{ dimension: 'execution', level: 'atom' },
			{ dimension: 'text-surface', level: 'atom' },
		],
		pbsi: ['implementation'],
		audiences: ['developers', 'computer'],
	});
}

// ─── 3. condition-specificity ──────────────────────────────

function conditionSpecificity(
	node: Node,
	_scope: ScopeAnalysis,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'IfStatement' && node.type !== 'WhileStatement') {
		return null;
	}

	const test = getRecord(node).test as Node;
	if (test.type !== 'BinaryExpression') {
		return null;
	}

	const testRecord = getRecord(test);
	const operator = testRecord.operator as string;
	if (operator !== '===' && operator !== '!==') {
		return null;
	}

	const left = testRecord.left as Node;
	const right = testRecord.right as Node;
	const isNullCheck =
		(left.type === 'Literal' && getRecord(left).value === null) ||
		(right.type === 'Literal' && getRecord(right).value === null);

	if (!isNullCheck) {
		return null;
	}

	return createCodeQuestion({
		id: 'condition-specificity',
		kind: 'micro-decision',
		category: 'clarity',
		feature: 'controlFlow',
		levels: ['semantics'],
		location: extractLocation(node),
		nodeType: node.type,
		context:
			`This condition explicitly checks for null. ` +
			`This **implementation** choice is more specific than a truthy/falsy check.`,
		questions: [
			{
				register: 'open',
				text: 'What is the difference between checking for null and checking for undefined?',
			},
			{
				register: 'comparative',
				text: 'How would this behave if the check used == instead of ===?',
			},
		],
		block: [{ dimension: 'execution', level: 'atom' }],
		pbsi: ['implementation'],
		audiences: ['developers', 'computer'],
	});
}

// ─── 4. simple-if-else ─────────────────────────────────────

function simpleIfElse(
	node: Node,
	_scope: ScopeAnalysis,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'IfStatement') {
		return null;
	}

	const record = getRecord(node);
	const consequent = record.consequent as Node;
	const alternate = record.alternate as Node | null;

	if (!alternate || alternate.type === 'IfStatement') {
		return null;
	}

	// Both branches must be blocks with exactly one statement
	if (consequent.type !== 'BlockStatement' || alternate.type !== 'BlockStatement') {
		return null;
	}

	const conBody = getRecord(consequent).body as Node[];
	const altBody = getRecord(alternate).body as Node[];

	if (conBody.length !== 1 || altBody.length !== 1) {
		return null;
	}

	return createCodeQuestion({
		id: 'simple-if-else',
		kind: 'micro-decision',
		category: 'clarity',
		feature: 'controlFlow',
		levels: ['syntax', 'semantics'],
		location: extractLocation(node),
		nodeType: node.type,
		context:
			`Both branches of this if/else contain a single statement. ` +
			`This **implementation** choice uses a full block structure for simple logic.`,
		questions: [
			{
				register: 'open',
				text: 'What is each branch accomplishing?',
			},
			{
				register: 'comparative',
				text: 'Could this logic be expressed more concisely?',
			},
		],
		block: [
			{ dimension: 'text-surface', level: 'block' },
			{ dimension: 'execution', level: 'block' },
		],
		pbsi: ['implementation'],
		audiences: ['developers'],
	});
}

// ─── 5. plus-overloading ───────────────────────────────────

function plusOverloading(
	node: Node,
	_scope: ScopeAnalysis,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'BinaryExpression') {
		return null;
	}

	const record = getRecord(node);
	if (record.operator !== '+') {
		return null;
	}

	const left = record.left as Node;
	const right = record.right as Node;

	// Only fire when BOTH sides are non-literals (type ambiguous)
	if (left.type === 'Literal' || right.type === 'Literal') {
		return null;
	}
	// Also skip TemplateLiteral — that's unambiguously string
	if (left.type === 'TemplateLiteral' || right.type === 'TemplateLiteral') {
		return null;
	}

	return createCodeQuestion({
		id: 'plus-overloading',
		kind: 'micro-decision',
		category: 'clarity',
		feature: 'operators',
		levels: ['semantics'],
		location: extractLocation(node),
		nodeType: node.type,
		context:
			`The + operator is used with two variables. The **computer** will add numbers or join strings ` +
			`depending on the runtime types — a reader must know what types to expect.`,
		questions: [
			{
				register: 'open',
				text: 'Is this operation adding numbers or joining strings?',
			},
			{
				register: 'pointed',
				text: 'What type of value does each side of + hold at this point?',
				hints: ['Trace the variables back to where they were assigned.'],
			},
		],
		block: [{ dimension: 'execution', level: 'atom' }],
		pbsi: ['implementation'],
		audiences: ['developers', 'computer'],
	});
}

// ─── Export ────────────────────────────────────────────────

const clarityAnalyzers: readonly AnalyzerEntry[] = [
	{ id: 'nested-conditions', analyze: nestedConditions },
	{ id: 'boolean-coercion', analyze: booleanCoercion },
	{ id: 'condition-specificity', analyze: conditionSpecificity },
	{ id: 'simple-if-else', analyze: simpleIfElse },
	{ id: 'plus-overloading', analyze: plusOverloading },
];

export default clarityAnalyzers;
