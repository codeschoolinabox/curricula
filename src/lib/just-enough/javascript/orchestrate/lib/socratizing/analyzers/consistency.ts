/**
 * @file Consistency category analyzers (micro-decision).
 *
 * @remarks Consistency analyzers are program-level: they inspect
 * the entire AST to detect places where the same concept is
 * expressed differently across the program. These fire once
 * after the point-analyzer walk completes.
 */

import type { Node } from 'acorn';

import type { ScopeAnalysis } from '../../../../embody/lib/scope/types.js';

import createCodeQuestion from '../create-code-question.js';
import extractLocation from '../extract-location.js';

import type { CodeQuestion, ProgramAnalyzerEntry } from '../types.js';

import collectNodes from './collect-nodes.js';
import getRecord from './get-record.js';

// ─── 1. mixed-declaration-style ────────────────────────────

/**
 * Detects programs that use both `let` and `const` where
 * some `let`s are never reassigned (inconsistent style).
 */
function mixedDeclarationStyle(
	ast: Node,
	scope: ScopeAnalysis,
	_source: string,
): readonly CodeQuestion[] {
	const hasConst = scope.allDeclarations.some((d) => d.kind === 'const');
	const hasUnreassignedLet = scope.allDeclarations.some(
		(d) => d.kind === 'let' && d.writeCount === 0,
	);

	if (!hasConst || !hasUnreassignedLet) {
		return [];
	}

	return [
		createCodeQuestion({
			id: 'mixed-declaration-style',
			kind: 'micro-decision',
			category: 'consistency',
			feature: 'variables',
			levels: ['syntax', 'connections'],
			location: extractLocation(ast),
			nodeType: 'Program',
			context:
				`This program uses both 'let' and 'const', but some 'let' declarations are never reassigned. ` +
				`This inconsistency in **implementation** affects how **developers** read the intent.`,
			questions: [
				{
					register: 'open',
					text: "Is the mix of 'let' and 'const' intentional throughout this program?",
				},
				{
					register: 'pointed',
					text: "Which 'let' declarations could be 'const' based on how they're used?",
				},
			],
			block: [
				{ dimension: 'text-surface', level: 'macro' },
				{ dimension: 'purpose', level: 'macro' },
			],
			pbsi: ['implementation'],
			audiences: ['developers'],
		}),
	];
}

// ─── 2. mixed-string-construction ──────────────────────────

/**
 * Detects programs that use both template literals (with
 * expressions) and string concatenation via +.
 */
function mixedStringConstruction(
	ast: Node,
	_scope: ScopeAnalysis,
	_source: string,
): readonly CodeQuestion[] {
	const hasTemplateLiteral = collectNodes(
		ast,
		new Set(['TemplateLiteral']),
	).some((node) => (getRecord(node).expressions as Node[]).length > 0);

	const hasConcatenation = collectNodes(
		ast,
		new Set(['BinaryExpression']),
	).some((node) => {
		const record = getRecord(node);
		if (record.operator !== '+') return false;
		const left = record.left as Node;
		const right = record.right as Node;
		return (
			(left.type === 'Literal' && typeof getRecord(left).value === 'string') ||
			(right.type === 'Literal' && typeof getRecord(right).value === 'string')
		);
	});

	if (!hasTemplateLiteral || !hasConcatenation) {
		return [];
	}

	return [
		createCodeQuestion({
			id: 'mixed-string-construction',
			kind: 'micro-decision',
			category: 'consistency',
			feature: 'data',
			levels: ['syntax', 'connections'],
			location: extractLocation(ast),
			nodeType: 'Program',
			context:
				`This program uses both template literals and string concatenation with +. ` +
				`Mixing approaches is a **implementation** consistency choice visible to **developers**.`,
			questions: [
				{
					register: 'open',
					text: 'Is there a reason different string construction methods are used in this program?',
				},
				{
					register: 'comparative',
					text: 'How would the code read if all string building used the same approach?',
				},
			],
			block: [{ dimension: 'text-surface', level: 'macro' }],
			pbsi: ['implementation'],
			audiences: ['developers'],
		}),
	];
}

// ─── 3. mixed-equality ─────────────────────────────────────

/**
 * Detects programs that use both strict (===) and loose (==)
 * equality operators.
 */
function mixedEquality(
	ast: Node,
	_scope: ScopeAnalysis,
	_source: string,
): readonly CodeQuestion[] {
	const comparisonNodes = collectNodes(ast, new Set(['BinaryExpression']));

	const hasStrict = comparisonNodes.some((node) => {
		const op = getRecord(node).operator as string;
		return op === '===' || op === '!==';
	});

	const hasLoose = comparisonNodes.some((node) => {
		const op = getRecord(node).operator as string;
		return op === '==' || op === '!=';
	});

	if (!hasStrict || !hasLoose) {
		return [];
	}

	return [
		createCodeQuestion({
			id: 'mixed-equality',
			kind: 'micro-decision',
			category: 'consistency',
			feature: 'operators',
			levels: ['syntax', 'connections'],
			location: extractLocation(ast),
			nodeType: 'Program',
			context:
				`This program uses both strict (===) and loose (==) equality. ` +
				`Mixing comparison styles is an **implementation** consistency choice.`,
			questions: [
				{
					register: 'open',
					text: 'Is the mix of strict and loose equality intentional?',
				},
				{
					register: 'pointed',
					text: 'Where is loose equality used, and does it behave differently than strict there?',
				},
			],
			block: [{ dimension: 'text-surface', level: 'macro' }],
			pbsi: ['implementation'],
			audiences: ['developers', 'computer'],
		}),
	];
}

// ─── 4. mixed-condition-style ──────────────────────────────

/**
 * Detects programs that use both truthy/falsy checks
 * (if (x)) and explicit comparisons (if (x !== null))
 * for similar patterns.
 */
function mixedConditionStyle(
	ast: Node,
	_scope: ScopeAnalysis,
	_source: string,
): readonly CodeQuestion[] {
	const conditionalNodes = collectNodes(
		ast,
		new Set(['IfStatement', 'WhileStatement']),
	);

	const hasTruthyCheck = conditionalNodes.some((node) => {
		const test = getRecord(node).test as Node;
		return (
			test.type === 'Identifier' ||
			(test.type === 'UnaryExpression' &&
				getRecord(test).operator === '!' &&
				(getRecord(test).argument as Node).type === 'Identifier')
		);
	});

	const hasExplicitCheck = conditionalNodes.some((node) => {
		const test = getRecord(node).test as Node;
		if (test.type !== 'BinaryExpression') {
			return false;
		}
		const op = getRecord(test).operator as string;
		return op === '===' || op === '!==' || op === '==' || op === '!=';
	});

	if (!hasTruthyCheck || !hasExplicitCheck) {
		return [];
	}

	return [
		createCodeQuestion({
			id: 'mixed-condition-style',
			kind: 'micro-decision',
			category: 'consistency',
			feature: 'controlFlow',
			levels: ['syntax', 'connections'],
			location: extractLocation(ast),
			nodeType: 'Program',
			context:
				`This program uses both truthy/falsy checks and explicit comparisons. ` +
				`Mixing condition styles is an **implementation** consistency choice for **developers**.`,
			questions: [
				{
					register: 'open',
					text: 'Is the mix of implicit and explicit conditions deliberate?',
				},
				{
					register: 'comparative',
					text: 'How would the code read if all conditions used the same style?',
				},
			],
			block: [{ dimension: 'text-surface', level: 'macro' }],
			pbsi: ['implementation'],
			audiences: ['developers'],
		}),
	];
}

// ─── Export ────────────────────────────────────────────────

const consistencyAnalyzers: readonly ProgramAnalyzerEntry[] = [
	{ id: 'mixed-declaration-style', analyze: mixedDeclarationStyle },
	{ id: 'mixed-string-construction', analyze: mixedStringConstruction },
	{ id: 'mixed-equality', analyze: mixedEquality },
	{ id: 'mixed-condition-style', analyze: mixedConditionStyle },
];

export default consistencyAnalyzers;
