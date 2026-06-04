/**
 * @file Generic comprehension analyzers (read-aloud, paths).
 *
 * @remarks Holistic program-level comprehension questions.
 * These are program analyzers that produce reading-level
 * questions about the whole program.
 */

import type { Node } from 'acorn';

import type { ScopeAnalysis } from '../../../../embody/lib/scope/types.js';

import createCodeQuestion from '../create-code-question.js';
import extractLocation from '../extract-location.js';

import type { CodeQuestion, ProgramAnalyzerEntry } from '../types.js';

import collectNodes from './collect-nodes.js';
import getRecord from './get-record.js';

// ─── 1. read-aloud ─────────────────────────────────────────

/**
 * Asks the reader to describe the program in plain language.
 * Only fires on programs with at least 2 statements.
 */
function readAloud(
	ast: Node,
	_scope: ScopeAnalysis,
	_source: string,
): readonly CodeQuestion[] {
	const body = getRecord(ast).body as Node[];
	if (!body || body.length < 2) {
		return [];
	}

	return [
		createCodeQuestion({
			id: 'read-aloud',
			kind: 'comprehension',
			category: 'clarity',
			feature: 'reading',
			levels: ['goals', 'userExperience'],
			location: extractLocation(ast),
			nodeType: 'Program',
			context:
				'Read the entire program and describe its **purpose** in plain language.',
			questions: [
				{
					register: 'open',
					text: 'In one or two sentences, what does this program do for the **user**?',
				},
				{
					register: 'pointed',
					text: 'Read the program line by line aloud. What does each line contribute?',
				},
			],
			block: [
				{ dimension: 'purpose', level: 'macro' },
				{ dimension: 'text-surface', level: 'macro' },
			],
			pbsi: ['purpose', 'behavior'],
			audiences: ['users', 'developers'],
		}),
	];
}

// ─── 2. program-paths ──────────────────────────────────────

/**
 * Asks about the different execution paths through the program.
 * Only fires if the program has at least one branching construct.
 */
function programPaths(
	ast: Node,
	_scope: ScopeAnalysis,
	_source: string,
): readonly CodeQuestion[] {
	const hasBranching =
		collectNodes(
			ast,
			new Set([
				'IfStatement',
				'ConditionalExpression',
				'WhileStatement',
				'ForOfStatement',
			]),
		).length > 0;

	if (!hasBranching) {
		return [];
	}

	return [
		createCodeQuestion({
			id: 'program-paths',
			kind: 'comprehension',
			category: 'clarity',
			feature: 'reading',
			levels: ['connections', 'goals'],
			location: extractLocation(ast),
			nodeType: 'Program',
			context:
				'This program has branching or looping, creating multiple possible execution paths.',
			questions: [
				{
					register: 'open',
					text: 'How many different paths can this program take from start to finish?',
				},
				{
					register: 'pointed',
					text: 'What inputs or conditions determine which path the program follows?',
				},
			],
			block: [
				{ dimension: 'execution', level: 'macro' },
				{ dimension: 'purpose', level: 'macro' },
			],
			pbsi: ['strategy', 'behavior'],
			audiences: ['developers', 'users'],
		}),
	];
}

// ─── 3. audience-perspective-taking ───────────────────────

/**
 * Asks the reader to consider the user's experience.
 * Only fires on programs with at least one user-interaction call
 * (prompt, alert, confirm).
 */
function audiencePerspectiveTaking(
	ast: Node,
	_scope: ScopeAnalysis,
	_source: string,
): readonly CodeQuestion[] {
	const interactionNames = new Set(['prompt', 'alert', 'confirm']);
	const callNodes = collectNodes(ast, new Set(['CallExpression']));

	const hasInteraction = callNodes.some((callNode) => {
		const callee = getRecord(callNode).callee as Node;
		if (callee.type === 'Identifier') {
			const name = getRecord(callee).name as string;
			return interactionNames.has(name);
		}
		return false;
	});

	if (!hasInteraction) {
		return [];
	}

	return [
		createCodeQuestion({
			id: 'audience-perspective-taking',
			kind: 'comprehension',
			category: 'clarity',
			feature: 'reading',
			levels: ['goals', 'userExperience'],
			location: extractLocation(ast),
			nodeType: 'Program',
			context: 'This program interacts with the **user** through dialog boxes.',
			questions: [
				{
					register: 'open',
					text: 'Describe what the **user** experiences when they run this program.',
				},
				{
					register: 'comparative',
					text: "How does the **user's** experience differ from what a **developer** sees in the code?",
				},
			],
			block: [
				{ dimension: 'purpose', level: 'macro' },
				{ dimension: 'execution', level: 'macro' },
			],
			pbsi: ['purpose', 'behavior'],
			audiences: ['users', 'developers'],
		}),
	];
}

// ─── Export ────────────────────────────────────────────────

const comprehensionGenericAnalyzers: readonly ProgramAnalyzerEntry[] = [
	{ id: 'read-aloud', analyze: readAloud },
	{ id: 'program-paths', analyze: programPaths },
	{ id: 'audience-perspective-taking', analyze: audiencePerspectiveTaking },
];

export default comprehensionGenericAnalyzers;
