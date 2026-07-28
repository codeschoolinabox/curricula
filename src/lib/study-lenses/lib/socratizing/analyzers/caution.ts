/**
 * @file Caution category analyzers (micro-decision).
 *
 * @remarks Caution analyzers detect patterns that are often
 * a bug but could be intentional. They ask questions that
 * help the reader decide whether the pattern is deliberate.
 */

import type { Node } from 'acorn';

import type { ScopeUsage } from '../../scoping/types.js';
import createCodeQuestion from '../create-code-question.js';
import extractLocation from '../extract-location.js';
import type { AnalyzerEntry, CodeQuestion } from '../types.js';

import getRecord from './get-record.js';

// ─── Helpers ───────────────────────────────────────────────

/** Expression-statement expressions that run for a side effect — not "unused". */
const SIDE_EFFECT_EXPRESSIONS: ReadonlySet<string> = new Set([
	'CallExpression',
	'NewExpression',
	'TaggedTemplateExpression',
	'AssignmentExpression',
	'UpdateExpression',
]);

/** Whether an expression runs for a side effect (its discarded result is intended). */
function hasSideEffect(expression: Node): boolean {
	if (SIDE_EFFECT_EXPRESSIONS.has(expression.type)) {
		return true;
	}
	return (
		expression.type === 'UnaryExpression' &&
		getRecord(expression).operator === 'delete'
	);
}

const LOOP_STATEMENTS: ReadonlySet<string> = new Set([
	'WhileStatement',
	'DoWhileStatement',
	'ForStatement',
	'ForInStatement',
	'ForOfStatement',
]);

/** Statements with a `.test` condition that an assignment could hide in. */
const CONDITION_STATEMENTS: ReadonlySet<string> = new Set([
	'IfStatement',
	'WhileStatement',
	'DoWhileStatement',
	'ForStatement',
]);

/** The block-bodied clause of a control-flow statement, or null for anything else. */
function controlFlowClause(node: Node): Node | null {
	if (node.type === 'IfStatement') {
		return getRecord(node).consequent as Node;
	}
	if (LOOP_STATEMENTS.has(node.type)) {
		return getRecord(node).body as Node;
	}
	return null;
}

// ─── 1. assignment-in-condition ────────────────────────────

function assignmentInCondition(
	node: Node,
	_scope: ScopeUsage,
	_source: string,
): CodeQuestion | null {
	if (!CONDITION_STATEMENTS.has(node.type)) {
		return null;
	}

	const test = getRecord(node).test as Node | null;
	if (test?.type !== 'AssignmentExpression') {
		return null;
	}

	return createCodeQuestion({
		id: 'assignment-in-condition',
		kind: 'micro-decision',
		category: 'caution',
		feature: 'operators',
		levels: ['syntax', 'semantics'],
		location: extractLocation(node),
		nodeType: node.type,
		context:
			`An assignment (=) appears inside a condition where a comparison might be expected. ` +
			`This **implementation** detail could change the program's **behavior** unexpectedly.`,
		questions: [
			{
				register: 'open',
				text: 'What is the difference between = and === in this position?',
			},
			{
				register: 'pointed',
				text: 'What value does the assignment produce for the condition to check?',
			},
		],
		block: [
			{ dimension: 'text-surface', level: 'atom' },
			{ dimension: 'execution', level: 'atom' },
		],
		pbsi: ['implementation', 'behavior'],
		audiences: ['developers', 'computer'],
	});
}

// ─── 2. empty-block ────────────────────────────────────────

function emptyBlock(
	node: Node,
	_scope: ScopeUsage,
	_source: string,
): CodeQuestion | null {
	// Only an empty CONTROL-FLOW body (if/loop) may signal missing code. A
	// standalone `{}` or an empty function/arrow body is commonly an intentional
	// stub — flagging those was noise, and mis-tagged as `controlFlow`.
	const clause = controlFlowClause(node);
	if (clause?.type !== 'BlockStatement') {
		return null;
	}
	if ((getRecord(clause).body as readonly Node[]).length > 0) {
		return null;
	}

	return createCodeQuestion({
		id: 'empty-block',
		kind: 'micro-decision',
		category: 'caution',
		feature: 'controlFlow',
		levels: ['syntax'],
		location: extractLocation(clause),
		nodeType: clause.type,
		context:
			`This block is empty — it contains no statements. ` +
			`An empty block may indicate missing **implementation** or intentional no-op.`,
		questions: [
			{
				register: 'open',
				text: 'What was the purpose of this block?',
			},
			{
				register: 'pointed',
				text: 'Was this block left empty intentionally, or is there missing code?',
			},
		],
		block: [{ dimension: 'text-surface', level: 'block' }],
		pbsi: ['implementation'],
		audiences: ['developers'],
	});
}

// ─── 3. unused-expression ──────────────────────────────────

function unusedExpression(
	node: Node,
	_scope: ScopeUsage,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'ExpressionStatement') {
		return null;
	}

	// A directive prologue ("use strict") is an ExpressionStatement but not a
	// value-producing expression — it switches execution mode, so its result
	// being "unused" is not a smell.
	if (getRecord(node).directive !== undefined) {
		return null;
	}

	const rawExpression = getRecord(node).expression as Node;
	// Optional chaining wraps its inner expression: `obj?.method()` parses as a
	// ChainExpression around the CallExpression — unwrap before classifying.
	const expression =
		rawExpression.type === 'ChainExpression'
			? (getRecord(rawExpression).expression as Node)
			: rawExpression;

	if (hasSideEffect(expression)) {
		return null;
	}

	return createCodeQuestion({
		id: 'unused-expression',
		kind: 'micro-decision',
		category: 'caution',
		feature: 'operators',
		levels: ['semantics'],
		location: extractLocation(node),
		nodeType: node.type,
		context:
			`This expression computes a value that is not stored or used. ` +
			`The **computer** evaluates it and discards the result.`,
		questions: [
			{
				register: 'open',
				text: 'What happens to the value this expression produces?',
			},
			{
				register: 'pointed',
				text: 'Is this expression meant to have a side effect, or is the result needed?',
			},
		],
		block: [{ dimension: 'execution', level: 'atom' }],
		pbsi: ['implementation'],
		audiences: ['developers', 'computer'],
	});
}

// ─── 4. unused-variable ────────────────────────────────────

function unusedVariable(
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
		if (id.type !== 'Identifier') {
			continue;
		}
		const name = getRecord(id).name as string;

		const declInfo = scope.allDeclarations.find(
			(d) => d.name === name && d.node === id,
		);

		// an exported binding is read from outside the module, so no local read
		// count can tell whether it is used — never call a module's API unused
		if (!declInfo || declInfo.readCount > 0 || declInfo.exported) {
			continue;
		}

		return createCodeQuestion({
			id: 'unused-variable',
			kind: 'micro-decision',
			category: 'caution',
			feature: 'variables',
			levels: ['semantics', 'goals'],
			location: extractLocation(node),
			nodeType: node.type,
			context:
				`The variable '${name}' is declared but never read. ` +
				`This may indicate missing **implementation** or an unnecessary declaration.`,
			questions: [
				{
					register: 'open',
					text: `What was the intended purpose of the variable '${name}'?`,
				},
				{
					register: 'pointed',
					text: `Is '${name}' needed, or could the declaration be removed?`,
				},
			],
			block: [
				{ dimension: 'text-surface', level: 'atom' },
				{ dimension: 'purpose', level: 'atom' },
			],
			pbsi: ['implementation'],
			audiences: ['developers'],
		});
	}

	return null;
}

// ─── 5. chained-assignment ─────────────────────────────────

function chainedAssignment(
	node: Node,
	_scope: ScopeUsage,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'AssignmentExpression') {
		return null;
	}

	const right = getRecord(node).right as Node;
	if (right.type !== 'AssignmentExpression') {
		return null;
	}

	return createCodeQuestion({
		id: 'chained-assignment',
		kind: 'micro-decision',
		category: 'caution',
		feature: 'operators',
		levels: ['syntax', 'semantics'],
		location: extractLocation(node),
		nodeType: node.type,
		context:
			`Multiple variables are assigned in a single expression. ` +
			`This **implementation** choice is concise but may be harder for **developers** to trace.`,
		questions: [
			{
				register: 'open',
				text: 'What value does each variable receive in this chain?',
			},
			{
				register: 'pointed',
				text: 'In what order are these assignments evaluated?',
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

const cautionAnalyzers: readonly AnalyzerEntry[] = [
	{ id: 'assignment-in-condition', analyze: assignmentInCondition },
	{ id: 'empty-block', analyze: emptyBlock },
	{ id: 'unused-expression', analyze: unusedExpression },
	{ id: 'unused-variable', analyze: unusedVariable },
	{ id: 'chained-assignment', analyze: chainedAssignment },
];

export default cautionAnalyzers;
