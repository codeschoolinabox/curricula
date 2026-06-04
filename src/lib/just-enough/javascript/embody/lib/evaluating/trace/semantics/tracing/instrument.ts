/**
 * @file Main-thread Aran instrumentation pipeline.
 *
 * Transforms JavaScript source into an instrumented code string using
 * Aran's standalone mode. The output is a self-contained script that
 * captures all builtins (learner code can't break Aran internals).
 *
 * Pipeline: pre-walk → acorn.parse → digest (builds tagMap) → Aran transpile
 * → createAspect (wraps pointcuts with tag resolution) → weaveFlexible
 * → retropile → astring.generate
 *
 * @remarks
 * This runs on the MAIN THREAD (static transformation). Only execution
 * runs in the worker. The output string is sent to the worker via postMessage.
 *
 * Standalone mode (`retropile({ mode: 'standalone' })`) embeds the intrinsic
 * record directly — no separate setupile/generateSetup call needed.
 */

import { parse } from 'acorn';
import { transpile, weaveFlexible, retropile } from 'aran';
import { generate } from 'astring';
import { walk } from 'estree-walker';

import createAspect from './weaving/create-aspect.js';

import type { JejTag } from './weaving/types.js';
import type { TracerState } from './weaving/types.js';
import type {
	SourceLocation,
	LoopKind,
	ControlFlowStructure,
} from './types.js';

type InstrumentResult = {
	readonly instrumentedCode: string;
	readonly initialState: TracerState;
	readonly tagMap: Map<string, JejTag>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ESTree nodes from acorn have dynamic shape
type EstreeNode = any;

/**
 * Pre-walks the parsed AST to build parent-dependent metadata.
 *
 * WHY: Aran's digest visits nodes bottom-up (children before parents).
 * A VariableDeclarator node can't access its parent VariableDeclaration's
 * `kind` field during digest. This pre-walk builds a lookup map first.
 *
 * @param ast - The parsed ESTree AST (acorn output)
 * @returns Map from ESTree node identity → parent-derived metadata
 */
function buildParentInfoMap(
	ast: EstreeNode,
): Map<EstreeNode, { bindingKind?: 'let' | 'const' }> {
	const parentInfo = new Map<EstreeNode, { bindingKind?: 'let' | 'const' }>();

	walk(ast, {
		enter(node: EstreeNode, parent: EstreeNode | null) {
			if (
				node.type === 'VariableDeclarator' &&
				parent?.type === 'VariableDeclaration' &&
				(parent.kind === 'let' || parent.kind === 'const')
			) {
				parentInfo.set(node, { bindingKind: parent.kind });
				// WHY propagate to Identifier: Aran's transpile maps
				// VariableDeclarator.id (Identifier) → WriteEffect. The
				// WriteEffect's tag hash points to the Identifier, not the
				// VariableDeclarator. So the Identifier's JejTag needs
				// bindingKind for effect-after to emit correct binding events.
				if (node.id?.type === 'Identifier') {
					parentInfo.set(node.id, { bindingKind: parent.kind });
				}
			}
		},
	});

	return parentInfo;
}

/**
 * Builds a JejTag from an ESTree node during Aran's digest phase.
 *
 * Captures metadata that Aran's desugaring would otherwise lose:
 * source location, original node type, source text, and semantic
 * properties like operator, binding kind, literal kind, etc.
 */
function buildJejTag(
	node: EstreeNode,
	code: string,
	parentInfo: Map<EstreeNode, { bindingKind?: 'let' | 'const' }>,
): JejTag {
	const loc: SourceLocation = node.loc
		? { start: { ...node.loc.start }, end: { ...node.loc.end } }
		: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } };

	const source =
		node.start !== undefined && node.end !== undefined
			? code.slice(node.start, node.end)
			: '';

	const tag: Record<string, unknown> = {
		loc,
		node: node.type ?? 'Unknown',
		source,
	};

	// Operator (BinaryExpression, UnaryExpression, AssignmentExpression, etc.)
	if (node.operator !== undefined) {
		tag.operator = node.operator;
	}

	// Binding kind — from parent VariableDeclaration
	if (node.type === 'VariableDeclaration' && node.kind) {
		tag.bindingKind = node.kind;
	}
	// VariableDeclarator inherits from pre-walk parent info
	const pInfo = parentInfo.get(node);
	if (pInfo?.bindingKind) {
		tag.bindingKind = pInfo.bindingKind;
	}

	// Literal kind
	if (node.type === 'Literal') {
		if (node.regex) {
			tag.literalKind = 'regex';
		} else if (node.value === null) {
			tag.literalKind = 'null';
		} else {
			tag.literalKind = typeof node.value;
		}
	}

	// Loop kind and structure
	if (node.type === 'WhileStatement') {
		tag.loopKind = 'while' as LoopKind;
		tag.structure = 'while' as ControlFlowStructure;
	}
	if (node.type === 'DoWhileStatement') {
		tag.loopKind = 'doWhile' as LoopKind;
		tag.structure = 'doWhile' as ControlFlowStructure;
	}
	if (node.type === 'ForStatement') {
		tag.loopKind = 'for' as LoopKind;
		tag.structure = 'for' as ControlFlowStructure;
	}
	if (node.type === 'ForOfStatement') {
		tag.loopKind = 'forOf' as LoopKind;
		tag.structure = 'forOf' as ControlFlowStructure;
	}
	if (node.type === 'IfStatement') {
		tag.structure = 'conditional' as ControlFlowStructure;
	}

	// Property access kind (MemberExpression)
	if (node.type === 'MemberExpression') {
		if (node.optional) {
			tag.accessKind = 'optionalChaining';
		} else if (node.computed) {
			tag.accessKind = 'bracket';
		} else {
			tag.accessKind = 'dot';
		}
	}

	// Jump target (BreakStatement, ContinueStatement)
	if (node.type === 'BreakStatement' || node.type === 'ContinueStatement') {
		tag.jumpTarget = node.label?.name ?? null;
	}

	// Template literal metadata
	if (node.type === 'TemplateLiteral') {
		tag.templateStrings = node.quasis.map(
			(q: EstreeNode) => q.value.cooked ?? q.value.raw,
		);
		tag.templateExpressionCount = node.expressions.length;
	}

	// Explicit initialization detection (VariableDeclarator with init)
	if (node.type === 'VariableDeclarator') {
		tag.explicit = node.init !== null && node.init !== undefined;
	}

	return tag as JejTag;
}

/**
 * Creates a digest function and tag map for Aran's transpile().
 *
 * Encapsulates the pre-walk (parent info) + digest (tag building) as a
 * single factory. The digest function is a closure over the parentInfo map
 * and the tagMap — it mutates the tagMap as a side effect during transpile.
 *
 * @param ast - Parsed ESTree AST
 * @param code - Original source code (for extracting source text)
 * @returns digest function + populated tagMap (populated during transpile)
 */
function createDigest(
	ast: EstreeNode,
	code: string,
): {
	digest: (node: EstreeNode, nodePath: string, filePath: string) => string;
	tagMap: Map<string, JejTag>;
	variableKinds: Record<string, 'let' | 'const'>;
} {
	const parentInfo = buildParentInfoMap(ast);
	const tagMap = new Map<string, JejTag>();

	// Build variable name → binding kind map from the pre-walk.
	// Used by block-declaration to emit correct kind on declare events.
	// WHY: block-declaration receives the block's tag (Program/Block), which
	// has no bindingKind. The actual kind is on the VariableDeclaration ESTree
	// node, which Aran desugars away before block-declaration fires.
	const variableKinds: Record<string, 'let' | 'const'> = {};
	for (const [node, info] of parentInfo.entries()) {
		if (node.type === 'Identifier' && node.name && info.bindingKind) {
			variableKinds[node.name] = info.bindingKind;
		}
	}

	function digest(
		node: EstreeNode,
		nodePath: string,
		filePath: string,
	): string {
		const hash = `${filePath}#${nodePath}`;
		tagMap.set(hash, buildJejTag(node, code, parentInfo));
		return hash;
	}

	return { digest, tagMap, variableKinds };
}

/**
 * Instruments JavaScript source code for tracing.
 *
 * @param code - JavaScript source to instrument
 * @param config - Trace config from options.schema.json
 * @returns The instrumented code string, initial tracer state, and tag map
 */
function instrument(
	code: string,
	config: Record<string, unknown>,
): InstrumentResult {
	// 1. Detect `with` statement → use script mode (module mode forbids `with`)
	// WHY: JEJ programs are modules (strict mode, no `var` hoisting). But the
	// worker evaluates via new Function() which can't handle `import.meta`.
	// Solution: use Aran's 'eval' kind with strict mode situ so the output is
	// eval-compatible with module-like semantics.
	// Exception: `with` requires sloppy mode → parse/transpile as script.
	const hasWithStatement = /\bwith\s*\(/.test(code);

	// 2. Parse source to ESTree
	// WHY always script: Aran's 'eval' kind requires sourceType: 'script'.
	// JEJ module semantics (strict mode, no var hoisting) are enforced by
	// Aran's situ: { type: 'local', mode: 'strict' }, not by ESTree sourceType.
	const ast = parse(code, {
		ecmaVersion: 2024,
		sourceType: 'script',
		locations: true,
	});

	// 3. Build digest function + tag map
	// WHY before transpile: the digest callback runs during transpile and
	// builds the tagMap as a side effect. The map must be fully populated
	// before createAspect is called.
	const { digest, tagMap, variableKinds } = createDigest(ast, code);

	// 4. Aran transpile: ESTree → AranLang (with custom digest for tag map)
	// WHY 'eval' kind: module kind generates import.meta which new Function()
	// can't execute. eval kind with strict situ gives module-like behavior
	// (strict mode, no var hoisting to global) without import.meta.
	const aranAST = transpile(
		{
			kind: hasWithStatement ? 'script' : 'eval',
			situ: hasWithStatement
				? { type: 'global' }
				: { type: 'local', mode: 'strict' },
			root: ast,
			path: 'learner.js',
		},
		{ global_declarative_record: 'builtin', digest },
	);

	// 5. Create aspect (pointcut config + advice globals + initial state)
	// WHY after transpile: createAspect needs the tagMap (populated by digest
	// during transpile) to wrap pointcuts for tag resolution.
	const aspect = createAspect(config, tagMap, variableKinds);

	// 6. Aran weaveFlexible: inject advice calls based on pointcut
	const woven = weaveFlexible(aranAST, {
		initial_state: aspect.initialState,
		pointcut: aspect.pointcut,
	});

	// 7. Aran retropile: AranLang → ESTree (standalone = embedded intrinsic setup)
	const output = retropile(woven, {
		mode: 'standalone',
	});

	// 8. Generate JavaScript string
	const instrumentedCode = generate(output);

	return {
		instrumentedCode,
		initialState: aspect.initialState,
		tagMap,
	};
}

export default instrument;
