/**
 * @file Comprehension analyzers for operators.
 *
 * @remarks Questions about understanding what operators do.
 */

import type { Node } from 'acorn';

import type { ScopeAnalysis } from '../../../../embody/lib/scope/types.js';
import createCodeQuestion from '../create-code-question.js';
import extractLocation from '../extract-location.js';
import type { AnalyzerEntry, CodeQuestion } from '../types.js';

import getRecord from './get-record.js';

// ─── 1. comparison-result ──────────────────────────────────

function comparisonResult(
	node: Node,
	_scope: ScopeAnalysis,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'BinaryExpression') {
		return null;
	}

	const operator = getRecord(node).operator as string;
	const comparisons = new Set(['===', '!==', '==', '!=', '<', '>', '<=', '>=']);
	if (!comparisons.has(operator)) {
		return null;
	}

	return createCodeQuestion({
		id: 'comparison-result',
		kind: 'comprehension',
		category: 'clarity',
		feature: 'operators',
		levels: ['semantics'],
		location: extractLocation(node),
		nodeType: node.type,
		context: `A comparison using ${operator} produces a boolean value.`,
		questions: [
			{
				register: 'pointed',
				text: `What value does this ${operator} comparison produce: true or false?`,
			},
			{
				register: 'open',
				text: 'What are the two values being compared?',
			},
		],
		block: [{ dimension: 'execution', level: 'atom' }],
		pbsi: ['implementation'],
		audiences: ['developers', 'computer'],
	});
}

// ─── 2. logical-operator-behavior ──────────────────────────

function logicalOperatorBehavior(
	node: Node,
	_scope: ScopeAnalysis,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'LogicalExpression') {
		return null;
	}

	const operator = getRecord(node).operator as string;
	if (operator !== '&&' && operator !== '||') {
		return null;
	}

	return createCodeQuestion({
		id: 'logical-operator-behavior',
		kind: 'comprehension',
		category: 'clarity',
		feature: 'operators',
		levels: ['semantics'],
		location: extractLocation(node),
		nodeType: node.type,
		context: `The logical ${operator} operator combines two conditions.`,
		questions: [
			{
				register: 'pointed',
				text:
					operator === '&&'
						? 'Does the right side always get evaluated, or only sometimes?'
						: 'When does JavaScript skip evaluating the right side?',
			},
			{
				register: 'open',
				text: `What does ${operator} require for the overall expression to be true?`,
			},
		],
		block: [{ dimension: 'execution', level: 'atom' }],
		pbsi: ['implementation', 'strategy'],
		audiences: ['developers', 'computer'],
	});
}

// ─── 3. arithmetic-result ──────────────────────────────────

function arithmeticResult(
	node: Node,
	_scope: ScopeAnalysis,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'BinaryExpression') {
		return null;
	}

	const operator = getRecord(node).operator as string;
	const arithmetic = new Set(['+', '-', '*', '/', '%']);
	if (!arithmetic.has(operator)) {
		return null;
	}

	// Skip + when it could be string concatenation (handled by string-construction)
	if (operator === '+') {
		const left = getRecord(node).left as Node;
		const right = getRecord(node).right as Node;
		if (
			(left.type === 'Literal' && typeof getRecord(left).value === 'string') ||
			(right.type === 'Literal' &&
				typeof getRecord(right).value === 'string') ||
			left.type === 'TemplateLiteral' ||
			right.type === 'TemplateLiteral'
		) {
			return null;
		}
	}

	return createCodeQuestion({
		id: 'arithmetic-result',
		kind: 'comprehension',
		category: 'clarity',
		feature: 'operators',
		levels: ['semantics'],
		location: extractLocation(node),
		nodeType: node.type,
		context: `An arithmetic operation using ${operator}.`,
		questions: [
			{
				register: 'pointed',
				text: `What value does this ${operator} operation produce?`,
			},
		],
		block: [{ dimension: 'execution', level: 'atom' }],
		pbsi: ['implementation'],
		audiences: ['computer'],
	});
}

// ─── 4. operator-swap ─────────────────────────────────────

function operatorSwap(
	node: Node,
	_scope: ScopeAnalysis,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'BinaryExpression') {
		return null;
	}

	const operator = getRecord(node).operator as string;
	const comparisons = new Set(['===', '!==', '<', '>', '<=', '>=']);
	if (!comparisons.has(operator)) {
		return null;
	}

	return createCodeQuestion({
		id: 'operator-swap',
		kind: 'comprehension',
		category: 'clarity',
		feature: 'operators',
		levels: ['semantics'],
		location: extractLocation(node),
		nodeType: node.type,
		context: `This comparison uses the '${operator}' operator.`,
		questions: [
			{
				register: 'comparative',
				text: `What would change in the program's behavior if '${operator}' were replaced with a different comparison operator?`,
			},
		],
		block: [{ dimension: 'execution', level: 'atom' }],
		pbsi: ['strategy', 'implementation'],
		audiences: ['developers', 'computer'],
	});
}

// ─── Export ────────────────────────────────────────────────

const comprehensionOperatorAnalyzers: readonly AnalyzerEntry[] = [
	{ id: 'comparison-result', analyze: comparisonResult },
	{ id: 'logical-operator-behavior', analyze: logicalOperatorBehavior },
	{ id: 'arithmetic-result', analyze: arithmeticResult },
	{ id: 'operator-swap', analyze: operatorSwap },
];

export default comprehensionOperatorAnalyzers;
