/**
 * @file Comprehension analyzers for user interaction.
 *
 * @remarks Questions about understanding prompt, alert, confirm,
 * console.log — the JeJ constructs that communicate with users.
 */

import type { Node } from 'acorn';

import type { ScopeAnalysis } from '../../../../embody/lib/scope/types.js';

import createCodeQuestion from '../create-code-question.js';
import extractLocation from '../extract-location.js';

import type { AnalyzerEntry, CodeQuestion } from '../types.js';

import getRecord from './get-record.js';
import getIdentifierName from './get-identifier-name.js';

// ─── 1. prompt-return-value ────────────────────────────────

function promptReturnValue(
	node: Node,
	_scope: ScopeAnalysis,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'CallExpression') {
		return null;
	}

	const callee = getRecord(node).callee as Node;
	if (getIdentifierName(callee) !== 'prompt') {
		return null;
	}

	return createCodeQuestion({
		id: 'prompt-return-value',
		kind: 'comprehension',
		category: 'clarity',
		feature: 'userInteraction',
		levels: ['semantics'],
		location: extractLocation(node),
		nodeType: node.type,
		context: 'prompt() pauses the program and waits for the **user** to type something.',
		questions: [
			{
				register: 'pointed',
				text: 'What type of value does prompt() return?',
			},
			{
				register: 'open',
				text: 'What happens if the user clicks Cancel instead of typing something?',
			},
		],
		block: [{ dimension: 'execution', level: 'atom' }],
		pbsi: ['behavior'],
		audiences: ['users', 'computer'],
	});
}

// ─── 2. alert-effect ───────────────────────────────────────

function alertEffect(
	node: Node,
	_scope: ScopeAnalysis,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'CallExpression') {
		return null;
	}

	const callee = getRecord(node).callee as Node;
	if (getIdentifierName(callee) !== 'alert') {
		return null;
	}

	return createCodeQuestion({
		id: 'alert-effect',
		kind: 'comprehension',
		category: 'clarity',
		feature: 'userInteraction',
		levels: ['semantics', 'userExperience'],
		location: extractLocation(node),
		nodeType: node.type,
		context: 'alert() shows a message to the **user** in a popup dialog.',
		questions: [
			{
				register: 'pointed',
				text: 'What message does the user see when this alert runs?',
			},
			{
				register: 'open',
				text: 'Why is this information shown to the user at this point in the program?',
			},
		],
		block: [
			{ dimension: 'execution', level: 'atom' },
			{ dimension: 'purpose', level: 'atom' },
		],
		pbsi: ['behavior', 'purpose'],
		audiences: ['users'],
	});
}

// ─── 3. confirm-behavior ───────────────────────────────────

function confirmBehavior(
	node: Node,
	_scope: ScopeAnalysis,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'CallExpression') {
		return null;
	}

	const callee = getRecord(node).callee as Node;
	if (getIdentifierName(callee) !== 'confirm') {
		return null;
	}

	return createCodeQuestion({
		id: 'confirm-behavior',
		kind: 'comprehension',
		category: 'clarity',
		feature: 'userInteraction',
		levels: ['semantics'],
		location: extractLocation(node),
		nodeType: node.type,
		context: 'confirm() asks the **user** a yes/no question.',
		questions: [
			{
				register: 'pointed',
				text: 'What value does confirm() return when the user clicks OK? Cancel?',
			},
			{
				register: 'open',
				text: 'What decision is the user being asked to make?',
			},
		],
		block: [{ dimension: 'execution', level: 'atom' }],
		pbsi: ['behavior'],
		audiences: ['users', 'computer'],
	});
}

// ─── Export ────────────────────────────────────────────────

const comprehensionInteractionAnalyzers: readonly AnalyzerEntry[] = [
	{ id: 'prompt-return-value', analyze: promptReturnValue },
	{ id: 'alert-effect', analyze: alertEffect },
	{ id: 'confirm-behavior', analyze: confirmBehavior },
];

export default comprehensionInteractionAnalyzers;
