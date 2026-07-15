/**
 * @file Easter-egg category analyzers (micro-decision).
 *
 * @remarks Easter-egg analyzers detect undocumented JeJ features
 * the learner has discovered — constructs not covered by
 * reference.md. These are fundamentally voice choices (exploring
 * the language beyond the documented subset).
 */

import type { Node } from 'acorn';

import type { ScopeAnalysis } from '../../../../../embody/lib/scope/types.js';
import createCodeQuestion from '../create-code-question.js';
import extractLocation from '../extract-location.js';
import type { AnalyzerEntry, CodeQuestion } from '../types.js';

import getRecord from './get-record.js';

// ─── 1. labeled-statement ──────────────────────────────────

function labeledStatement(
	node: Node,
	_scope: ScopeAnalysis,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'LabeledStatement') {
		return null;
	}

	const label = getRecord(node).label as Node;
	const name = getRecord(label).name as string;

	return createCodeQuestion({
		id: 'labeled-statement',
		kind: 'micro-decision',
		category: 'easter-egg',
		feature: 'controlFlow',
		levels: ['syntax'],
		location: extractLocation(node),
		nodeType: node.type,
		context:
			`A labeled statement '${name}:' is used here. Labels are not in the JeJ reference — ` +
			`this is an undocumented feature the learner discovered.`,
		questions: [
			{
				register: 'open',
				text: `What does the label '${name}:' do in this code?`,
			},
			{
				register: 'pointed',
				text: 'Where did you learn about this feature?',
			},
		],
		block: [{ dimension: 'text-surface', level: 'atom' }],
		pbsi: ['implementation'],
		audiences: ['developers'],
	});
}

// ─── 2. void-operator ──────────────────────────────────────

function voidOperator(
	node: Node,
	_scope: ScopeAnalysis,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'UnaryExpression') {
		return null;
	}

	if (getRecord(node).operator !== 'void') {
		return null;
	}

	return createCodeQuestion({
		id: 'void-operator',
		kind: 'micro-decision',
		category: 'easter-egg',
		feature: 'operators',
		levels: ['syntax', 'semantics'],
		location: extractLocation(node),
		nodeType: node.type,
		context:
			`The void operator is used here. This is not in the JeJ reference — ` +
			`the learner is exploring a rarely-used unary operator.`,
		questions: [
			{
				register: 'open',
				text: 'What value does the void operator produce?',
			},
			{
				register: 'pointed',
				text: 'What happens to the value of the expression after void?',
			},
		],
		block: [
			{ dimension: 'text-surface', level: 'atom' },
			{ dimension: 'execution', level: 'atom' },
		],
		pbsi: ['implementation'],
		audiences: ['developers', 'computer'],
	});
}

// ─── 3. comma-operator ─────────────────────────────────────

function commaOperator(
	node: Node,
	_scope: ScopeAnalysis,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'SequenceExpression') {
		return null;
	}

	return createCodeQuestion({
		id: 'comma-operator',
		kind: 'micro-decision',
		category: 'easter-egg',
		feature: 'operators',
		levels: ['syntax', 'semantics'],
		location: extractLocation(node),
		nodeType: node.type,
		context:
			`The comma operator sequences multiple expressions into one. ` +
			`This is not in the JeJ reference.`,
		questions: [
			{
				register: 'open',
				text: 'Which expression in this sequence determines the final value?',
			},
			{
				register: 'pointed',
				text: 'What happens to the values of the earlier expressions?',
			},
		],
		block: [
			{ dimension: 'text-surface', level: 'atom' },
			{ dimension: 'execution', level: 'atom' },
		],
		pbsi: ['implementation'],
		audiences: ['developers', 'computer'],
	});
}

// ─── 4. with-statement ─────────────────────────────────────

function withStatement(
	node: Node,
	_scope: ScopeAnalysis,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'WithStatement') {
		return null;
	}

	return createCodeQuestion({
		id: 'with-statement',
		kind: 'micro-decision',
		category: 'easter-egg',
		feature: 'controlFlow',
		levels: ['syntax', 'semantics'],
		location: extractLocation(node),
		nodeType: node.type,
		context:
			`The 'with' statement injects an object's properties into scope. ` +
			`This is deprecated in modern JavaScript and not in the JeJ reference.`,
		questions: [
			{
				register: 'open',
				text: "What does 'with' do to the scope inside its body?",
			},
			{
				register: 'pointed',
				text: 'Why is this feature considered problematic in modern JavaScript?',
			},
		],
		block: [
			{ dimension: 'text-surface', level: 'block' },
			{ dimension: 'execution', level: 'block' },
		],
		pbsi: ['implementation', 'strategy'],
		audiences: ['developers', 'computer'],
	});
}

// ─── 5. typeof-operator ────────────────────────────────────

function typeofOperator(
	node: Node,
	_scope: ScopeAnalysis,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'UnaryExpression') {
		return null;
	}

	if (getRecord(node).operator !== 'typeof') {
		return null;
	}

	return createCodeQuestion({
		id: 'typeof-operator',
		kind: 'micro-decision',
		category: 'easter-egg',
		feature: 'operators',
		levels: ['syntax', 'semantics'],
		location: extractLocation(node),
		nodeType: node.type,
		context:
			`The typeof operator checks a value's runtime type. ` +
			`This is not in the JeJ reference — the learner is exploring type introspection.`,
		questions: [
			{
				register: 'open',
				text: 'What string does typeof return for this value?',
			},
			{
				register: 'pointed',
				text: 'What are all the possible strings typeof can return?',
			},
		],
		block: [
			{ dimension: 'text-surface', level: 'atom' },
			{ dimension: 'execution', level: 'atom' },
		],
		pbsi: ['implementation'],
		audiences: ['developers', 'computer'],
	});
}

// ─── 6. optional-chaining ──────────────────────────────────

function optionalChaining(
	node: Node,
	_scope: ScopeAnalysis,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'ChainExpression') {
		return null;
	}

	return createCodeQuestion({
		id: 'optional-chaining',
		kind: 'micro-decision',
		category: 'easter-egg',
		feature: 'operators',
		levels: ['syntax', 'semantics'],
		location: extractLocation(node),
		nodeType: node.type,
		context:
			`Optional chaining (?.) safely accesses properties that might not exist. ` +
			`This modern JavaScript feature short-circuits to undefined instead of throwing.`,
		questions: [
			{
				register: 'open',
				text: 'What happens if the value before ?. is null or undefined?',
			},
			{
				register: 'comparative',
				text: 'How would this line behave without the ?. operator?',
			},
		],
		block: [
			{ dimension: 'text-surface', level: 'atom' },
			{ dimension: 'execution', level: 'atom' },
		],
		pbsi: ['implementation'],
		audiences: ['developers', 'computer'],
	});
}

// ─── Export ────────────────────────────────────────────────

const easterEggAnalyzers: readonly AnalyzerEntry[] = [
	{ id: 'labeled-statement', analyze: labeledStatement },
	{ id: 'void-operator', analyze: voidOperator },
	{ id: 'comma-operator', analyze: commaOperator },
	{ id: 'with-statement', analyze: withStatement },
	{ id: 'typeof-operator', analyze: typeofOperator },
	{ id: 'optional-chaining', analyze: optionalChaining },
];

export default easterEggAnalyzers;
