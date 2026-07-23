/**
 * @file Comprehension analyzers for variables.
 *
 * @remarks Questions about understanding variable declarations,
 * reads, and writes. Adapted from the ask/ prior art levels 0-2.
 */

import type { Node } from 'acorn';

import type { ScopeUsage } from '../../scoping/types.js';
import createCodeQuestion from '../create-code-question.js';
import extractLocation from '../extract-location.js';
import type { AnalyzerEntry, CodeQuestion } from '../types.js';

import getIdentifierName from './get-identifier-name.js';
import getRecord from './get-record.js';

/**
 * Whether an initializer is effectively a plain literal value — a bare literal,
 * a unary operator on a literal (`-5`, `!true`, `void 0`), or a template literal
 * with no `${...}` substitutions — so it does not read as "an expression".
 */
function isTrivialInitializer(init: Node): boolean {
	if (init.type === 'Literal') {
		return true;
	}
	if (init.type === 'UnaryExpression') {
		return (getRecord(init).argument as Node).type === 'Literal';
	}
	if (init.type === 'TemplateLiteral') {
		return (getRecord(init).expressions as readonly Node[]).length === 0;
	}
	return false;
}

// ─── 1. what-is-declared ───────────────────────────────────

function whatIsDeclared(
	node: Node,
	_scope: ScopeUsage,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'VariableDeclaration') {
		return null;
	}

	const declarators = getRecord(node).declarations as readonly Node[];
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
	_scope: ScopeUsage,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'VariableDeclaration') {
		return null;
	}

	const declarators = getRecord(node).declarations as readonly Node[];
	for (const declarator of declarators) {
		const init = getRecord(declarator).init as Node | null;
		if (!init) {
			continue;
		}
		const name = getIdentifierName(getRecord(declarator).id as Node);
		if (!name) {
			continue;
		}

		// Only fire on a non-trivial initializer (an actual expression, not a
		// literal / negated literal / substitution-free template).
		if (isTrivialInitializer(init)) {
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
	scope: ScopeUsage,
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

	// LIMITATION (contract-bounded, surfaced to maintainers): `left` is a USE of
	// the variable, but the flat ScopeUsage only carries declaration nodes — it
	// cannot resolve a use to its binding. So this matches by name alone and can
	// mis-attribute under shadowing / fire on an undeclared-global assignment
	// that shares a name. A correct fix needs ScopeUsage to expose reference
	// resolution (an enhancement that also serves the Stage-3 quizzing engine).
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
	scope: ScopeUsage,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'VariableDeclaration') {
		return null;
	}

	const declarators = getRecord(node).declarations as readonly Node[];
	for (const declarator of declarators) {
		const id = getRecord(declarator).id as Node;
		const name = getIdentifierName(id);
		if (!name) {
			continue;
		}

		// Match by node identity, not name: a shadowing inner binding must not
		// inherit an outer same-name binding's write count (which would frame a
		// never-reassigned variable as a mutating "role"). `continue` (not
		// `return`) so a later declarator in `let a, b` is still considered.
		const decl = scope.allDeclarations.find(
			(d) => d.name === name && d.node === id,
		);
		if (!decl || decl.writeCount === 0) {
			continue;
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
