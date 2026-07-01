/**
 * @file Projects a validated JEJ program + its package scope analysis into
 * this tier's clone-safe {@link ScopeTable}.
 *
 * @remarks Pure function (the Project phase of the pipeline, DOCS.md § 2). The
 * package scope analysis (`scope/build-scope.ts`) is re-homed for this tier:
 * the top scope is renamed `program` → `script` (NM vocabulary); declaration-
 * less blocks are dropped (the NM elides the environment of a block with no
 * lexical declarations); classic `for (let i …)` head bindings — which
 * build-scope homes in the ENCLOSING scope and overwrites across sibling loops
 * — are lifted into one synthesized `for`-scope per loop so sibling loops never
 * collide. Each scope's table key is its `$`-rooted {@link NodePath} from the
 * canonical `buildNodePathMap`, the same key I2's instrumentation and the
 * worker's `__$vr.open/close(scopePath)` address.
 */

import type { Node } from 'acorn';

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import buildNodePathMap from '../../../parse-old/build-node-path-map.js';
import getChildNodes from '../../../parse-old/get-child-nodes.js';
import type { ScopeAnalysis, ScopeInfo } from '../../../scope/types.js';

import type {
	DeclaredVariable,
	NodePath,
	ScopeKind,
	ScopeTable,
	ScopeTableEntry,
} from './types.js';

/**
 * Projects the tier's scope table from a validated program and its analysis.
 *
 * @param program - The validated JEJ `Program` AST (used to address every
 *   scope by node path and to find classic-`for` heads build-scope hides).
 * @param scopeAnalysis - The package scope analysis of the same `program`.
 * @returns A deeply frozen {@link ScopeTable}, keyed by scope node path.
 */
export default function projectScopeTable(
	program: Node,
	scopeAnalysis: ScopeAnalysis,
): ScopeTable {
	const nodePathMap = buildNodePathMap(program);
	const table: Record<NodePath, ScopeTableEntry> = {};

	// Pass A — lift each classic `for (let i …)` head into its own synthesized
	// for-scope. build-scope homes for-init declarations in the ENCLOSING scope
	// and overwrites sibling loops there, so the head ids are recorded for Pass B
	// to re-home them out of that enclosing scope.
	const forHeadIds = new Set<Node>();
	const forStatements: Node[] = [];
	collectForStatements(program, forStatements);
	for (const forStatement of forStatements) {
		const variables = readForHead(forStatement, forHeadIds);
		if (variables.length > 0) {
			// reachable from `program`, so the path lookup is always present
			const scopePath = nodePathMap.get(forStatement)!;
			table[scopePath] = { scopeKind: 'for', variables };
		}
	}

	// Pass B — project build-scope's scopes (script / block / for-of), skipping
	// re-homed for-head declarations and dropping any non-script scope left
	// declaration-less.
	projectScopes(scopeAnalysis.root, forHeadIds, nodePathMap, table);

	return deepFreezeInPlace(table);
}

// ─── For-head synthesis (Pass A) ───────────────────────────────────────────────

/**
 * Collects every `ForStatement` reachable from `node` into `found`, in source
 * order. (build-scope surfaces no scope for classic `for`, so the tier finds
 * the loops itself.)
 */
function collectForStatements(node: Node, found: Node[]): void {
	if (node.type === 'ForStatement') {
		found.push(node);
	}
	for (const child of getChildNodes(node)) {
		collectForStatements(child, found);
	}
}

/**
 * Reads a classic-`for` head's declared bindings (`for (let i …)` /
 * `for (const i …)`), in declarator order, and records each binding's `id`
 * node in `forHeadIds` for re-homing. Returns `[]` when the head declares
 * nothing (`for (;;)`, `for (i = 0; …)`), so no for-scope is synthesized.
 */
function readForHead(
	forStatement: Node,
	forHeadIds: Set<Node>,
): DeclaredVariable[] {
	const init = (forStatement as unknown as Record<string, unknown>)
		.init as Node | null;
	if (init?.type !== 'VariableDeclaration') {
		return [];
	}

	const initRecord = init as unknown as Record<string, unknown>;
	const kind = initRecord.kind as 'let' | 'const';
	const declarators = initRecord.declarations as readonly Node[];
	const variables: DeclaredVariable[] = [];
	for (const declarator of declarators) {
		const id = (declarator as unknown as Record<string, unknown>).id as Node;
		if (id.type === 'Identifier') {
			const name = (id as unknown as Record<string, unknown>).name as string;
			variables.push({ name, kind });
			forHeadIds.add(id);
		}
	}
	return variables;
}

// ─── Scope projection (Pass B) ─────────────────────────────────────────────────

/**
 * Recursively projects a build-scope `ScopeInfo` subtree into `table`. The
 * script scope is always emitted; a block / for-of scope is emitted only when
 * it has at least one surviving (non-re-homed) declaration.
 */
function projectScopes(
	scope: ScopeInfo,
	forHeadIds: ReadonlySet<Node>,
	nodePathMap: ReadonlyMap<Node, NodePath>,
	table: Record<NodePath, ScopeTableEntry>,
): void {
	const variables = projectVariables(scope, forHeadIds);
	if (scope.kind === 'program' || variables.length > 0) {
		// reachable from `program`, so the path lookup is always present
		const scopePath = nodePathMap.get(scope.node)!;
		table[scopePath] = { scopeKind: mapScopeKind(scope.kind), variables };
	}
	for (const child of scope.children) {
		projectScopes(child, forHeadIds, nodePathMap, table);
	}
}

/**
 * Projects a scope's declarations to `{ name, kind }` in source order, skipping
 * any declaration re-homed into a synthesized for-scope.
 */
function projectVariables(
	scope: ScopeInfo,
	forHeadIds: ReadonlySet<Node>,
): DeclaredVariable[] {
	const variables: DeclaredVariable[] = [];
	for (const declaration of scope.declarations.values()) {
		if (forHeadIds.has(declaration.node)) {
			continue;
		}
		variables.push({ name: declaration.name, kind: declaration.kind });
	}
	return variables;
}

/** Renames build-scope's top scope to the NM `script`; others pass through. */
function mapScopeKind(kind: ScopeInfo['kind']): ScopeKind {
	return kind === 'program' ? 'script' : kind;
}
