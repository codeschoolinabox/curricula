/**
 * @file Comprehension analyzers for control flow.
 *
 * @remarks Questions about understanding if/else, while, for-of.
 * Adapted from ask/ levels 2-4.
 */

import type { Node } from 'acorn';

import type { ScopeUsage } from '../../../scoping/types.js';
import createCodeQuestion from '../create-code-question.js';
import extractLocation from '../extract-location.js';
import type { AnalyzerEntry, CodeQuestion } from '../types.js';

import getRecord from './get-record.js';

// ─── 1. if-branches ────────────────────────────────────────

function ifBranches(
	node: Node,
	_scope: ScopeUsage,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'IfStatement') {
		return null;
	}

	return createCodeQuestion({
		id: 'if-branches',
		kind: 'comprehension',
		category: 'clarity',
		feature: 'controlFlow',
		levels: ['semantics', 'connections'],
		location: extractLocation(node),
		nodeType: node.type,
		context: 'An if statement creates branching paths in the program.',
		questions: [
			{
				register: 'pointed',
				text: 'What condition must be true for the if-body to execute?',
			},
			{
				register: 'open',
				text: 'Describe in plain language what this if statement decides.',
			},
		],
		block: [
			{ dimension: 'execution', level: 'block' },
			{ dimension: 'purpose', level: 'block' },
		],
		pbsi: ['strategy', 'behavior'],
		audiences: ['developers', 'computer'],
	});
}

// ─── 2. while-loop-behavior ────────────────────────────────

function whileLoopBehavior(
	node: Node,
	_scope: ScopeUsage,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'WhileStatement') {
		return null;
	}

	return createCodeQuestion({
		id: 'while-loop-behavior',
		kind: 'comprehension',
		category: 'clarity',
		feature: 'controlFlow',
		levels: ['semantics', 'connections'],
		location: extractLocation(node),
		nodeType: node.type,
		context: 'A while loop repeats its body as long as its condition is true.',
		questions: [
			{
				register: 'pointed',
				text: 'What condition keeps this loop running?',
			},
			{
				register: 'open',
				text: 'What changes inside the loop to eventually make the condition false?',
			},
			{
				register: 'comparative',
				text: 'What would happen if the condition never became false?',
			},
		],
		block: [
			{ dimension: 'execution', level: 'block' },
			{ dimension: 'purpose', level: 'block' },
		],
		pbsi: ['strategy', 'behavior'],
		audiences: ['developers', 'computer'],
	});
}

// ─── 3. for-of-iteration ───────────────────────────────────

function forOfIteration(
	node: Node,
	_scope: ScopeUsage,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'ForOfStatement') {
		return null;
	}

	return createCodeQuestion({
		id: 'for-of-iteration',
		kind: 'comprehension',
		category: 'clarity',
		feature: 'controlFlow',
		levels: ['semantics', 'connections'],
		location: extractLocation(node),
		nodeType: node.type,
		context: 'A for...of loop visits each element of a collection.',
		questions: [
			{
				register: 'pointed',
				text: 'What collection is being iterated? What does each element represent?',
			},
			{
				register: 'open',
				text: 'How many times will the loop body execute?',
			},
		],
		block: [
			{ dimension: 'execution', level: 'block' },
			{ dimension: 'purpose', level: 'block' },
		],
		pbsi: ['strategy', 'behavior'],
		audiences: ['developers', 'computer'],
	});
}

// ─── 4. else-branch-purpose ────────────────────────────────

function elseBranchPurpose(
	node: Node,
	_scope: ScopeUsage,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'IfStatement') {
		return null;
	}

	const alternate = getRecord(node).alternate as Node | null;
	if (!alternate) {
		return null;
	}

	return createCodeQuestion({
		id: 'else-branch-purpose',
		kind: 'comprehension',
		category: 'clarity',
		feature: 'controlFlow',
		levels: ['semantics', 'goals'],
		location: extractLocation(node),
		nodeType: node.type,
		context: 'This if statement has an else branch.',
		questions: [
			{
				register: 'pointed',
				text: 'When does the else branch execute?',
			},
			{
				register: 'open',
				text: 'What does the else branch handle that the if branch does not?',
			},
		],
		block: [
			{ dimension: 'execution', level: 'block' },
			{ dimension: 'purpose', level: 'block' },
		],
		pbsi: ['strategy', 'purpose'],
		audiences: ['developers'],
	});
}

// ─── 5. describe-condition ─────────────────────────────────

function describeCondition(
	node: Node,
	_scope: ScopeUsage,
	source: string,
): CodeQuestion | null {
	if (node.type !== 'IfStatement' && node.type !== 'WhileStatement') {
		return null;
	}

	const test = getRecord(node).test as Node;
	const conditionSource = source.slice(test.start, test.end);
	const label = node.type === 'IfStatement' ? 'if statement' : 'while loop';

	return createCodeQuestion({
		id: 'describe-condition',
		kind: 'comprehension',
		category: 'clarity',
		feature: 'controlFlow',
		levels: ['semantics'],
		location: extractLocation(node),
		nodeType: node.type,
		context: `The condition \`${conditionSource}\` controls this ${label}.`,
		questions: [
			{
				register: 'open',
				text: 'Describe this condition in plain English.',
			},
			{
				register: 'pointed',
				text: 'What values make this condition true? What values make it false?',
			},
		],
		block: [{ dimension: 'execution', level: 'block' }],
		pbsi: ['strategy', 'behavior'],
		audiences: ['developers', 'computer'],
	});
}

// ─── 6. control-flow-boundary ─────────────────────────────

function controlFlowBoundary(
	node: Node,
	_scope: ScopeUsage,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'WhileStatement' && node.type !== 'ForOfStatement') {
		return null;
	}

	return createCodeQuestion({
		id: 'control-flow-boundary',
		kind: 'comprehension',
		category: 'clarity',
		feature: 'controlFlow',
		levels: ['semantics', 'connections'],
		location: extractLocation(node),
		nodeType: node.type,
		context: 'This loop has boundary conditions worth examining.',
		questions: [
			{
				register: 'open',
				text: 'What happens on the first iteration? The last? If the collection is empty?',
			},
			{
				register: 'pointed',
				text: 'Under what condition does this loop execute zero times?',
			},
		],
		block: [
			{ dimension: 'execution', level: 'block' },
			{ dimension: 'purpose', level: 'block' },
		],
		pbsi: ['strategy', 'behavior'],
		audiences: ['developers', 'computer'],
	});
}

// ─── 7. next-lines ────────────────────────────────────────

function nextLines(
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

	const location = extractLocation(node);

	return createCodeQuestion({
		id: 'next-lines',
		kind: 'comprehension',
		category: 'clarity',
		feature: 'controlFlow',
		levels: ['semantics'],
		location,
		nodeType: node.type,
		context: `After this statement executes, the program's path depends on a condition.`,
		questions: [
			{
				register: 'pointed',
				text: 'After this statement executes, which statement runs next?',
			},
			{
				register: 'open',
				text: 'Trace the execution path through this structure for a specific input.',
			},
		],
		block: [{ dimension: 'execution', level: 'block' }],
		pbsi: ['implementation'],
		audiences: ['developers', 'computer'],
	});
}

// ─── Export ────────────────────────────────────────────────

const comprehensionControlFlowAnalyzers: readonly AnalyzerEntry[] = [
	{ id: 'if-branches', analyze: ifBranches },
	{ id: 'while-loop-behavior', analyze: whileLoopBehavior },
	{ id: 'for-of-iteration', analyze: forOfIteration },
	{ id: 'else-branch-purpose', analyze: elseBranchPurpose },
	{ id: 'describe-condition', analyze: describeCondition },
	{ id: 'control-flow-boundary', analyze: controlFlowBoundary },
	{ id: 'next-lines', analyze: nextLines },
];

export default comprehensionControlFlowAnalyzers;
