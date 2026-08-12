/**
 * @file Voice category analyzers (micro-decision).
 *
 * @remarks Voice analyzers detect style choices — places where
 * the programmer chose one equally valid alternative over another.
 * These are the purest form of micro-decision: neither choice is
 * wrong, but the choice shapes the program's voice.
 */

import type { Node } from 'acorn';

import type { ScopeUsage } from '../../../scoping/types.js';
import createCodeQuestion from '../create-code-question.js';
import extractLocation from '../extract-location.js';
import type { AnalyzerEntry, CodeQuestion } from '../types.js';

import getIdentifierName from './get-identifier-name.js';
import getRecord from './get-record.js';

// ─── Helpers ───────────────────────────────────────────────

/** Known string methods available in JeJ. */
const STRING_METHODS: ReadonlySet<string> = new Set([
	'toLowerCase',
	'toUpperCase',
	'includes',
	'startsWith',
	'endsWith',
	'slice',
	'trim',
	'trimStart',
	'trimEnd',
	'replace',
	'replaceAll',
	'repeat',
	'padStart',
	'padEnd',
	'charAt',
	'indexOf',
	'lastIndexOf',
]);

// ─── 1. let-vs-const ──────────────────────────────────────

function letVsConst(
	node: Node,
	scope: ScopeUsage,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'VariableDeclaration') {
		return null;
	}

	const record = getRecord(node);
	if (record.kind !== 'let') {
		return null;
	}

	const declarators = record.declarations as readonly Node[];
	for (const declarator of declarators) {
		const id = getRecord(declarator).id as Node;
		const name = getIdentifierName(id);
		if (!name) {
			continue;
		}

		// Match the binding at THIS declaration site by node identity, not by
		// name: a shadowing inner `let x` must not resolve to an outer `x`'s
		// write count. Suggesting `const` for a reassigned shadowed `let` would
		// make the learner's code throw at runtime.
		const declInfo = scope.allDeclarations.find(
			(d) => d.name === name && d.node === id && d.kind === 'let',
		);

		if (!declInfo || declInfo.writeCount > 0) {
			continue;
		}

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
					hints: [
						'Check for assignment operators (=) with this variable on the left side.',
					],
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

// ─── 2. naming-descriptiveness ─────────────────────────────

function namingDescriptiveness(
	node: Node,
	_scope: ScopeUsage,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'VariableDeclaration') {
		return null;
	}

	const declarators = getRecord(node).declarations as readonly Node[];
	for (const declarator of declarators) {
		const id = getRecord(declarator).id as Node;
		const name = getIdentifierName(id);
		if (!name || name.length > 2) {
			continue;
		}

		return createCodeQuestion({
			id: 'naming-descriptiveness',
			kind: 'micro-decision',
			category: 'voice',
			feature: 'variables',
			levels: ['syntax'],
			location: extractLocation(node),
			nodeType: node.type,
			context:
				`The variable '${name}' uses a ${name.length}-character name. ` +
				`This **implementation** choice affects how **developers** understand its purpose.`,
			questions: [
				{
					register: 'open',
					text: `What does the name '${name}' communicate about this variable's role?`,
				},
				{
					register: 'pointed',
					text: `Could a reader unfamiliar with this code guess what '${name}' stores?`,
				},
				{
					register: 'comparative',
					text: `How would the code read if this variable had a longer, more descriptive name?`,
				},
			],
			block: [{ dimension: 'text-surface', level: 'atom' }],
			pbsi: ['implementation'],
			audiences: ['developers'],
		});
	}

	return null;
}

// ─── 3. string-construction ────────────────────────────────

function stringConstruction(
	node: Node,
	_scope: ScopeUsage,
	_source: string,
): CodeQuestion | null {
	if (node.type === 'TemplateLiteral') {
		const exprs = getRecord(node).expressions as readonly Node[];
		if (exprs.length === 0) {
			return null;
		}
		return createCodeQuestion({
			id: 'string-construction',
			kind: 'micro-decision',
			category: 'voice',
			feature: 'data',
			levels: ['syntax'],
			location: extractLocation(node),
			nodeType: node.type,
			context:
				`A template literal with \${} expressions is used to build a string. ` +
				`This **implementation** choice uses modern JavaScript syntax for string construction.`,
			questions: [
				{
					register: 'open',
					text: 'What makes template literals different from string concatenation with +?',
				},
				{
					register: 'comparative',
					text: 'How would this string look if built with the + operator instead?',
				},
			],
			block: [{ dimension: 'text-surface', level: 'atom' }],
			pbsi: ['implementation'],
			audiences: ['developers'],
		});
	}

	if (node.type === 'BinaryExpression') {
		const record = getRecord(node);
		if (record.operator !== '+') {
			return null;
		}
		const left = record.left as Node;
		const right = record.right as Node;
		const leftIsString =
			left.type === 'Literal' && typeof getRecord(left).value === 'string';
		const rightIsString =
			right.type === 'Literal' && typeof getRecord(right).value === 'string';
		if (!leftIsString && !rightIsString) {
			return null;
		}
		return createCodeQuestion({
			id: 'string-construction',
			kind: 'micro-decision',
			category: 'voice',
			feature: 'data',
			levels: ['syntax'],
			location: extractLocation(node),
			nodeType: node.type,
			context:
				`The + operator is used for string concatenation. ` +
				`This **implementation** choice is an alternative to template literals.`,
			questions: [
				{
					register: 'open',
					text: 'What are the trade-offs of using + for string building?',
				},
				{
					register: 'comparative',
					text: 'How would this expression look as a template literal?',
				},
			],
			block: [{ dimension: 'text-surface', level: 'atom' }],
			pbsi: ['implementation'],
			audiences: ['developers'],
		});
	}

	return null;
}

// ─── 4. ternary-vs-if-else ─────────────────────────────────

function ternaryVsIfElse(
	node: Node,
	_scope: ScopeUsage,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'ConditionalExpression') {
		return null;
	}

	return createCodeQuestion({
		id: 'ternary-vs-if-else',
		kind: 'micro-decision',
		category: 'voice',
		feature: 'controlFlow',
		levels: ['syntax', 'semantics'],
		location: extractLocation(node),
		nodeType: node.type,
		context:
			`A ternary expression (? :) is used rather than an if/else block. ` +
			`This **implementation** choice affects how **developers** read the logic.`,
		questions: [
			{
				register: 'open',
				text: 'What makes this expression easy or hard to read?',
			},
			{
				register: 'pointed',
				text: 'What are the two possible values this expression can produce?',
			},
			{
				register: 'comparative',
				text: 'How would this logic look as an if/else block?',
			},
		],
		block: [
			{ dimension: 'text-surface', level: 'atom' },
			{ dimension: 'execution', level: 'atom' },
		],
		pbsi: ['implementation'],
		audiences: ['developers'],
	});
}

// ─── 5. string-method-choice ───────────────────────────────

function stringMethodChoice(
	node: Node,
	_scope: ScopeUsage,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'CallExpression') {
		return null;
	}

	const callee = getRecord(node).callee as Node;
	if (callee.type !== 'MemberExpression') {
		return null;
	}

	const calleeRecord = getRecord(callee);
	if (calleeRecord.computed) {
		return null;
	}

	const property = calleeRecord.property as Node;
	const methodName = getIdentifierName(property);
	if (!methodName || !STRING_METHODS.has(methodName)) {
		return null;
	}

	return createCodeQuestion({
		id: 'string-method-choice',
		kind: 'micro-decision',
		category: 'voice',
		feature: 'functions',
		levels: ['syntax', 'semantics'],
		location: extractLocation(node),
		nodeType: node.type,
		context:
			`The method '.${methodName}()' is called here. ` +
			`This **implementation** choice selects one string operation over alternatives.`,
		questions: [
			{
				register: 'open',
				text: `What does the method '.${methodName}()' do to its input?`,
			},
			{
				register: 'pointed',
				text: `What value does this '.${methodName}()' call produce?`,
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

// ─── 6. nullish-coalescing ─────────────────────────────────

function nullishCoalescing(
	node: Node,
	_scope: ScopeUsage,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'LogicalExpression') {
		return null;
	}

	if (getRecord(node).operator !== '??') {
		return null;
	}

	return createCodeQuestion({
		id: 'nullish-coalescing',
		kind: 'micro-decision',
		category: 'voice',
		feature: 'operators',
		levels: ['syntax', 'semantics'],
		location: extractLocation(node),
		nodeType: node.type,
		context:
			`The nullish coalescing operator (??) is used here. ` +
			`This **implementation** choice handles missing values with modern JavaScript syntax.`,
		questions: [
			{
				register: 'open',
				text: "What values does ?? treat as 'missing'?",
			},
			{
				register: 'comparative',
				text: 'How would this line behave if || were used instead of ???',
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

// ─── 7. for-of-iterator-naming ─────────────────────────────

function forOfIteratorNaming(
	node: Node,
	_scope: ScopeUsage,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'ForOfStatement') {
		return null;
	}

	const left = getRecord(node).left as Node;
	if (left.type !== 'VariableDeclaration') {
		return null;
	}

	const declarators = getRecord(left).declarations as readonly Node[];
	if (declarators.length === 0) {
		return null;
	}

	const id = getRecord(declarators[0]).id as Node;
	const name = getIdentifierName(id);
	if (!name) {
		return null;
	}

	return createCodeQuestion({
		id: 'for-of-iterator-naming',
		kind: 'micro-decision',
		category: 'voice',
		feature: 'variables',
		levels: ['syntax', 'connections'],
		location: extractLocation(node),
		nodeType: node.type,
		context:
			`The for...of loop uses '${name}' as its iterator variable. ` +
			`This **implementation** choice signals the relationship between each element and the collection.`,
		questions: [
			{
				register: 'open',
				text: `What does the name '${name}' tell you about each element?`,
			},
			{
				register: 'comparative',
				text: 'How would a different iterator name affect readability?',
			},
		],
		block: [
			{ dimension: 'text-surface', level: 'atom' },
			{ dimension: 'purpose', level: 'block' },
		],
		pbsi: ['implementation'],
		audiences: ['developers'],
	});
}

// ─── 8. input-validation-strategy ──────────────────────────

function inputValidationStrategy(
	node: Node,
	_scope: ScopeUsage,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'CallExpression') {
		return null;
	}

	const callee = getRecord(node).callee as Node;
	const name = getIdentifierName(callee);
	if (name !== 'prompt') {
		return null;
	}

	return createCodeQuestion({
		id: 'input-validation-strategy',
		kind: 'micro-decision',
		category: 'voice',
		feature: 'userInteraction',
		levels: ['semantics', 'goals'],
		location: extractLocation(node),
		nodeType: node.type,
		context:
			`The program collects **user** input with prompt(). ` +
			`The **strategy** for validating this input shapes the **user** experience.`,
		questions: [
			{
				register: 'open',
				text: 'What could the **user** type or do that this program needs to handle?',
			},
			{
				register: 'pointed',
				text: 'What value does prompt() return if the user clicks Cancel?',
			},
		],
		block: [
			{ dimension: 'execution', level: 'block' },
			{ dimension: 'purpose', level: 'block' },
		],
		pbsi: ['strategy', 'behavior'],
		audiences: ['users', 'developers'],
	});
}

// ─── 9. console-log-audience ───────────────────────────────

function consoleLogAudience(
	node: Node,
	_scope: ScopeUsage,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'CallExpression') {
		return null;
	}

	const callee = getRecord(node).callee as Node;
	if (callee.type !== 'MemberExpression') {
		return null;
	}

	const calleeRecord = getRecord(callee);
	const object = calleeRecord.object as Node;
	const property = calleeRecord.property as Node;

	if (getIdentifierName(object) !== 'console') {
		return null;
	}
	if (getIdentifierName(property) !== 'log') {
		return null;
	}

	return createCodeQuestion({
		id: 'console-log-audience',
		kind: 'micro-decision',
		category: 'voice',
		feature: 'userInteraction',
		levels: ['syntax', 'goals'],
		location: extractLocation(node),
		nodeType: node.type,
		context:
			`console.log() communicates through the browser console — visible to **developers** but not typical **users**. ` +
			`This **implementation** choice determines who sees this output.`,
		questions: [
			{
				register: 'open',
				text: 'Who is the intended audience for this console.log()?',
			},
			{
				register: 'comparative',
				text: 'How would using alert() instead change who sees this output?',
			},
		],
		block: [
			{ dimension: 'text-surface', level: 'atom' },
			{ dimension: 'purpose', level: 'atom' },
		],
		pbsi: ['implementation'],
		audiences: ['developers', 'users'],
	});
}

// ─── 10. operator-choice ───────────────────────────────────

function operatorChoice(
	node: Node,
	_scope: ScopeUsage,
	_source: string,
): CodeQuestion | null {
	if (node.type !== 'BinaryExpression') {
		return null;
	}

	const operator = getRecord(node).operator as string;
	if (operator !== '===' && operator !== '!==') {
		return null;
	}

	return createCodeQuestion({
		id: 'operator-choice',
		kind: 'micro-decision',
		category: 'voice',
		feature: 'operators',
		levels: ['syntax', 'semantics'],
		location: extractLocation(node),
		nodeType: node.type,
		context:
			`This comparison uses strict equality (${operator}). ` +
			`This **implementation** choice determines how the **computer** compares values.`,
		questions: [
			{
				register: 'open',
				text: 'What does strict equality check that other comparisons might not?',
			},
			{
				register: 'pointed',
				text: 'What types of values are being compared here?',
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

const voiceAnalyzers: readonly AnalyzerEntry[] = [
	{ id: 'let-vs-const', analyze: letVsConst },
	{ id: 'naming-descriptiveness', analyze: namingDescriptiveness },
	{ id: 'string-construction', analyze: stringConstruction },
	{ id: 'ternary-vs-if-else', analyze: ternaryVsIfElse },
	{ id: 'string-method-choice', analyze: stringMethodChoice },
	{ id: 'nullish-coalescing', analyze: nullishCoalescing },
	{ id: 'for-of-iterator-naming', analyze: forOfIteratorNaming },
	{ id: 'input-validation-strategy', analyze: inputValidationStrategy },
	{ id: 'console-log-audience', analyze: consoleLogAudience },
	{ id: 'operator-choice', analyze: operatorChoice },
];

export default voiceAnalyzers;
