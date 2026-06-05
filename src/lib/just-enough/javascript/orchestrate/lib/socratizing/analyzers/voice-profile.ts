/**
 * @file Voice profile analyzer (program-level).
 *
 * @remarks Characterizes the overall "personality" of a program
 * along five dimensions. Research basis: Caliskan-Islam et al. 2015,
 * Stegeman et al. 2014/2016, Buse & Weimer 2010.
 *
 * Dimensions:
 * 1. Verbose <-> Terse — naming, line length
 * 2. Modern <-> Traditional — idiom adoption (template literals, ??, ?.)
 * 3. Linear <-> Structured — control flow depth
 * 4. Consistent <-> Eclectic — variation across choices
 * 5. Expressive <-> Mechanical — communication intent
 */

import type { Node } from 'acorn';

import getChildNodes from '../../../../embody/lib/parse-old/get-child-nodes.js';
import type { ScopeAnalysis } from '../../../../embody/lib/scope/types.js';
import createCodeQuestion from '../create-code-question.js';
import extractLocation from '../extract-location.js';
import type { CodeQuestion, ProgramAnalyzerEntry } from '../types.js';

import collectNodes from './collect-nodes.js';
import getRecord from './get-record.js';

// ─── Metrics ───────────────────────────────────────────────

type VoiceMetrics = {
	avgNameLength: number;
	hasTemplateLiterals: boolean;
	hasNullishCoalescing: boolean;
	hasOptionalChaining: boolean;
	maxNestingDepth: number;
	totalStatements: number;
};

const statementTypes: ReadonlySet<string> = new Set([
	'ExpressionStatement',
	'VariableDeclaration',
	'IfStatement',
	'WhileStatement',
	'ForOfStatement',
]);

/**
 * Pure recursive function that returns the maximum BlockStatement
 * nesting depth found under `node`.
 */
function computeMaxNesting(node: Node, depth: number): number {
	const currentDepth = node.type === 'BlockStatement' ? depth : 0;
	const nextDepth = node.type === 'BlockStatement' ? depth + 1 : depth;

	let max = currentDepth;
	for (const child of getChildNodes(node)) {
		max = Math.max(max, computeMaxNesting(child, nextDepth));
	}
	return max;
}

function collectMetrics(ast: Node, scope: ScopeAnalysis): VoiceMetrics {
	const hasTemplateLiterals = collectNodes(
		ast,
		new Set(['TemplateLiteral']),
	).some((node) => (getRecord(node).expressions as Node[]).length > 0);

	const hasNullishCoalescing = collectNodes(
		ast,
		new Set(['LogicalExpression']),
	).some((node) => getRecord(node).operator === '??');

	const hasOptionalChaining =
		collectNodes(ast, new Set(['ChainExpression'])).length > 0;

	const totalStatements = collectNodes(ast, statementTypes).length;

	const maxNestingDepth = computeMaxNesting(ast, 0);

	const names = scope.allDeclarations.map((d) => d.name);
	const avgNameLength =
		names.length > 0
			? names.reduce((sum, n) => sum + n.length, 0) / names.length
			: 0;

	return {
		avgNameLength,
		hasTemplateLiterals,
		hasNullishCoalescing,
		hasOptionalChaining,
		maxNestingDepth,
		totalStatements,
	};
}

// ─── Voice profile ─────────────────────────────────────────

/**
 * Produces a macro-level question about the program's voice.
 * Only fires on programs with at least 3 statements.
 */
function voiceProfile(
	ast: Node,
	scope: ScopeAnalysis,
	_source: string,
): readonly CodeQuestion[] {
	const metrics = collectMetrics(ast, scope);

	if (metrics.totalStatements < 3) {
		return [];
	}

	const traits: string[] = [];
	if (metrics.avgNameLength > 6) {
		traits.push('descriptive naming');
	} else if (metrics.avgNameLength > 0 && metrics.avgNameLength <= 3) {
		traits.push('terse naming');
	}
	if (
		metrics.hasTemplateLiterals ||
		metrics.hasNullishCoalescing ||
		metrics.hasOptionalChaining
	) {
		traits.push('modern idioms');
	}
	if (metrics.maxNestingDepth >= 2) {
		traits.push('structured control flow');
	}

	const traitDescription =
		traits.length > 0
			? `Notable traits: ${traits.join(', ')}.`
			: 'The voice is relatively neutral across all dimensions.';

	return [
		createCodeQuestion({
			id: 'voice-profile',
			kind: 'micro-decision',
			category: 'voice',
			feature: 'reading',
			levels: ['goals'],
			location: extractLocation(ast),
			nodeType: 'Program',
			context: `The aggregate of all micro-decisions shapes this program's voice. ${traitDescription}`,
			questions: [
				{
					register: 'open',
					text: 'Reading this program as a whole, what words would you use to describe its character?',
				},
				{
					register: 'comparative',
					text: 'How would you describe the difference in voice if this program used shorter names and fewer modern features?',
				},
			],
			block: [
				{ dimension: 'text-surface', level: 'macro' },
				{ dimension: 'purpose', level: 'macro' },
			],
			pbsi: ['purpose'],
			audiences: ['developers'],
		}),
	];
}

// ─── Export ────────────────────────────────────────────────

const voiceProfileAnalyzers: readonly ProgramAnalyzerEntry[] = [
	{ id: 'voice-profile', analyze: voiceProfile },
];

export default voiceProfileAnalyzers;
