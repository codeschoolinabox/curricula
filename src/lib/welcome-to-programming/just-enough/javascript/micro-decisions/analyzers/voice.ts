/**
 * @file Voice category analyzers (micro-decision).
 *
 * @remarks Voice analyzers detect style choices — places where
 * the programmer chose one equally valid alternative over another.
 * These are the purest form of micro-decision: neither choice is
 * wrong, but the choice shapes the program's voice.
 *
 * Currently implements:
 * - `let-vs-const`: a `let` that is never reassigned
 */

import type { Node } from 'acorn';

import type { ScopeAnalysis } from '../../scope/types.js';

import createCodeQuestion from '../create-code-question.js';
import extractLocation from '../extract-location.js';

import type { CodeQuestion, PointAnalyzer } from '../types.js';

// ─── let-vs-const ──────────────────────────────────────────

/**
 * Detects `let` declarations that are never reassigned.
 *
 * @remarks A `let` with zero writes after declaration could be
 * `const`. This is a voice choice: `const` signals intent ("this
 * won't change") while `let` signals flexibility. Neither is wrong.
 *
 * BLOCK: atom × text-surface (the keyword) + atom × purpose (intent)
 * PBSI: implementation
 * Audiences: developers (naming/intent signal)
 */
function letVsConst(
	node: Node,
	scope: ScopeAnalysis,
	source: string,
): CodeQuestion | null {
	if (node.type !== 'VariableDeclaration') {
		return null;
	}

	const record = node as unknown as Record<string, unknown>;
	const kind = record.kind as string;

	if (kind !== 'let') {
		return null;
	}

	// Check if any declarator in this declaration is never written
	const declarators = record.declarations as Node[];
	for (const declarator of declarators) {
		const declRecord = declarator as unknown as Record<string, unknown>;
		const id = declRecord.id as Node;

		if (id.type !== 'Identifier') {
			continue;
		}

		const name = (id as unknown as Record<string, unknown>).name as string;

		// Find this declaration in the scope analysis
		const declInfo = scope.allDeclarations.find(
			(d) => d.name === name && d.kind === 'let',
		);

		if (!declInfo || declInfo.writeCount > 0) {
			continue;
		}

		// This `let` is never reassigned — it could be `const`
		return createCodeQuestion({
			id: 'let-vs-const',
			kind: 'micro-decision',
			category: 'voice',
			feature: 'variables',
			levels: ['syntax'],
			location: extractLocation(node),
			nodeType: node.type,
			context:
				`The variable '${name}' is declared with 'let' but is never reassigned. ` +
				`This **implementation** choice affects how **other developers** read the code.`,
			questions: [
				{
					register: 'open',
					text: `What does the keyword 'let' signal to a reader about the variable '${name}'?`,
				},
				{
					register: 'pointed',
					text: `How many times is '${name}' reassigned after its declaration?`,
					hints: ['Check for assignment operators (=) with this variable on the left side.'],
				},
				{
					register: 'comparative',
					text: `How would the meaning change if 'let' were replaced with 'const' here?`,
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

export default letVsConst;
