/**
 * @file Comprehension analyzers for variables.
 *
 * @remarks Questions about understanding variable declarations,
 * reads, and writes. Adapted from the ask/ prior art levels 0-2.
 */

import type { Node } from 'acorn';

import type { ScopeAnalysis } from '../../../../embody/lib/scope/types.js';

import createCodeQuestion from '../create-code-question.js';
import extractLocation from '../extract-location.js';

import type { AnalyzerEntry, CodeQuestion } from '../types.js';

import getRecord from './get-record.js';
import getIdentifierName from './get-identifier-name.js';

// ─── 1. what-is-declared ───────────────────────────────────

function whatIsDeclared(
	node: Node,
	_scope: ScopeAnalysis,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'VariableDeclaration') {
		return null;
	}

	const declarators = getRecord(node).declarations as Node[];
	const kind = getRecord(node).kind as string;
	for (const declarator of declarators) {
		const name = getIdentifierName(getRecord(declarator).id as Node);
		if (!name) {
			continue;
		}

		return createCodeQuestion({
			id: 'what-is-declared',
			kind: 'comprehension',
			category: 'clarity',
			feature: 'variables',
			levels: ['syntax'],
			location: extractLocation(node),
			nodeType: node.type,
			context: `A variable '${name}' is declared with '${kind}'.`,
			questions: [
				{
					register: 'open',
					text: `What does the line declaring '${name}' do?`,
				},
				{
					register: 'pointed',
					text: `What value does '${name}' hold after this line executes?`,
				},
			],
			block: [{ dimension: 'text-surface', level: 'atom' }],
			pbsi: ['purpose', 'implementation'],
			audiences: ['developers'],
		});
	}
	return null;
}

// ─── 2. what-value-stored ──────────────────────────────────

function whatValueStored(
	node: Node,
	_scope: ScopeAnalysis,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'VariableDeclaration') {
		return null;
	}

	const declarators = getRecord(node).declarations as Node[];
	for (const declarator of declarators) {
		const init = getRecord(declarator).init as Node | null;
		if (!init) {
			continue;
		}
		const name = getIdentifierName(getRecord(declarator).id as Node);
		if (!name) {
			continue;
		}

		// Only fire on non-trivial init (not just a literal)
		if (init.type === 'Literal') {
			continue;
		}

		return createCodeQuestion({
			id: 'what-value-stored',
			kind: 'comprehension',
			category: 'clarity',
			feature: 'variables',
			levels: ['semantics'],
			location: extractLocation(node),
			nodeType: node.type,
			context: `The variable '${name}' is initialized with an expression.`,
			questions: [
				{
					register: 'pointed',
					text: `What value does the expression on the right side of = produce?`,
				},
				{
					register: 'open',
					text: `Describe in plain language what '${name}' ends up storing.`,
				},
			],
			block: [{ dimension: 'execution', level: 'atom' }],
			pbsi: ['implementation'],
			audiences: ['developers', 'computer'],
		});
	}
	return null;
}

// ─── 3. how-variable-changes ───────────────────────────────

function howVariableChanges(
	node: Node,
	scope: ScopeAnalysis,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'AssignmentExpression') {
		return null;
	}

	const left = getRecord(node).left as Node;
	const name = getIdentifierName(left);
	if (!name) {
		return null;
	}

	const decl = scope.allDeclarations.find((d) => d.name === name);
	if (!decl) {
		return null;
	}

	return createCodeQuestion({
		id: 'how-variable-changes',
		kind: 'comprehension',
		category: 'clarity',
		feature: 'variables',
		levels: ['semantics'],
		location: extractLocation(node),
		nodeType: node.type,
		context: `The variable '${name}' is being reassigned.`,
		questions: [
			{
				register: 'pointed',
				text: `What was '${name}' before this line? What is it after?`,
			},
			{
				register: 'open',
				text: `Why does '${name}' need to change at this point in the program?`,
			},
		],
		block: [{ dimension: 'execution', level: 'atom' }],
		pbsi: ['implementation', 'strategy'],
		audiences: ['developers', 'computer'],
	});
}

// ─── 4. variable-role ─────────────────────────────────────

function variableRole(
	node: Node,
	scope: ScopeAnalysis,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'VariableDeclaration') {
		return null;
	}

	const declarators = getRecord(node).declarations as Node[];
	for (const declarator of declarators) {
		const name = getIdentifierName(getRecord(declarator).id as Node);
		if (!name) {
			continue;
		}

		const decl = scope.allDeclarations.find((d) => d.name === name);
		if (!decl || decl.writeCount === 0) {
			return null;
		}

		return createCodeQuestion({
			id: 'variable-role',
			kind: 'comprehension',
			category: 'clarity',
			feature: 'variables',
			levels: ['semantics', 'goals'],
			location: extractLocation(node),
			nodeType: node.type,
			context: `The variable '${name}' is reassigned during the program — it plays a specific role.`,
			questions: [
				{
					register: 'open',
					text: `What role does '${name}' play in this program? (counter, accumulator, flag, holder)`,
				},
				{
					register: 'pointed',
					text: `How does '${name}' change over the course of the program?`,
				},
			],
			block: [
				{ dimension: 'execution', level: 'block' },
				{ dimension: 'purpose', level: 'block' },
			],
			pbsi: ['strategy', 'implementation'],
			audiences: ['developers'],
		});
	}
	return null;
}

// ─── Export ────────────────────────────────────────────────

const comprehensionVariableAnalyzers: readonly AnalyzerEntry[] = [
	{ id: 'what-is-declared', analyze: whatIsDeclared },
	{ id: 'what-value-stored', analyze: whatValueStored },
	{ id: 'how-variable-changes', analyze: howVariableChanges },
	{ id: 'variable-role', analyze: variableRole },
];

export default comprehensionVariableAnalyzers;
