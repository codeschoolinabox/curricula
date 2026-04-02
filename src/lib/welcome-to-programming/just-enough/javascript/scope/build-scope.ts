/**
 * @file Builds a scope analysis from a parsed JeJ AST.
 *
 * @remarks Pure function: AST in, frozen ScopeAnalysis out.
 * Walks the AST once, tracking declarations and references
 * through a scope chain. Consumed by `validating/` and
 * `micro-decisions/`.
 *
 * JeJ scope boundaries: Program, BlockStatement, ForOfStatement.
 * No functions, classes, catch clauses, or `var`.
 */

import type { Node } from 'acorn';

import getChildNodes from '../validating/get-child-nodes.js';

import type {
	DeclarationInfo,
	ScopeAnalysis,
	ScopeInfo,
	ScopeKind,
} from './types.js';

// ─── Mutable internal types ────────────────────────────────

type MutableDeclaration = {
	name: string;
	kind: 'let' | 'const';
	node: Node;
	initNode: Node | null;
	readCount: number;
	writeCount: number;
	scopeDepth: number;
};

type MutableScope = {
	kind: ScopeKind;
	node: Node;
	parent: MutableScope | null;
	declarations: Map<string, MutableDeclaration>;
	children: MutableScope[];
	depth: number;
};

// ─── Scope chain helpers ───────────────────────────────────

/**
 * Looks up a name in the scope chain, walking from inner to outer.
 */
function lookupDeclaration(
	name: string,
	scope: MutableScope,
): MutableDeclaration | null {
	let current: MutableScope | null = scope;
	while (current) {
		const decl = current.declarations.get(name);
		if (decl) {
			return decl;
		}
		current = current.parent;
	}
	return null;
}

/**
 * Creates a new child scope and adds it to the parent's children.
 */
function createChildScope(
	kind: ScopeKind,
	node: Node,
	parent: MutableScope,
): MutableScope {
	const child: MutableScope = {
		kind,
		node,
		parent,
		declarations: new Map(),
		children: [],
		depth: parent.depth + 1,
	};
	parent.children.push(child);
	return child;
}

/**
 * Registers a variable declaration in a scope.
 */
function registerDeclaration(
	name: string,
	kind: 'let' | 'const',
	declaratorNode: Node,
	initNode: Node | null,
	scope: MutableScope,
): void {
	scope.declarations.set(name, {
		name,
		kind,
		node: declaratorNode,
		initNode,
		readCount: 0,
		writeCount: 0,
		scopeDepth: scope.depth,
	});
}

// ─── AST walk ──────────────────────────────────────────────

/**
 * Recursive scope-aware walk.
 *
 * @remarks `isAssignmentTarget` marks when the current node
 * is the left-hand side of an AssignmentExpression — so the
 * Identifier handler knows to count a write instead of a read.
 *
 * `isCompoundAssignment` marks when the assignment operator is
 * compound (+=, -=, etc.) — the LHS is both read and written.
 */
function walkScope(
	node: Node,
	scope: MutableScope,
	isAssignmentTarget: boolean,
	isCompoundAssignment: boolean,
): void {
	const record = node as unknown as Record<string, unknown>;

	switch (node.type) {
		case 'Program': {
			for (const child of getChildNodes(node)) {
				walkScope(child, scope, false, false);
			}
			break;
		}

		case 'BlockStatement': {
			const blockScope = createChildScope('block', node, scope);
			for (const child of getChildNodes(node)) {
				walkScope(child, blockScope, false, false);
			}
			break;
		}

		case 'ForOfStatement': {
			const forOfScope = createChildScope('for-of', node, scope);

			// Register the iteration variable
			const left = record.left as Node;
			if (left.type === 'VariableDeclaration') {
				const leftRecord = left as unknown as Record<string, unknown>;
				const kind = leftRecord.kind as 'let' | 'const';
				const declarators = leftRecord.declarations as Node[];
				if (declarators.length > 0) {
					const declarator = declarators[0] as unknown as Record<
						string,
						unknown
					>;
					const id = declarator.id as Node;
					if (id.type === 'Identifier') {
						const name = (id as unknown as Record<string, unknown>)
							.name as string;
						registerDeclaration(name, kind, id, null, forOfScope);
					}
				}
			}

			// Walk the right-hand side (iterable) in the PARENT scope
			const right = record.right as Node;
			walkScope(right, scope, false, false);

			// Walk the body in the for-of scope
			// If the body is a BlockStatement, don't create another nested scope
			const body = record.body as Node;
			if (body.type === 'BlockStatement') {
				for (const child of getChildNodes(body)) {
					walkScope(child, forOfScope, false, false);
				}
			} else {
				walkScope(body, forOfScope, false, false);
			}
			break;
		}

		case 'VariableDeclaration': {
			const kind = record.kind as 'let' | 'const';
			const declarators = record.declarations as Node[];
			for (const declarator of declarators) {
				const declRecord = declarator as unknown as Record<
					string,
					unknown
				>;
				const id = declRecord.id as Node;
				const init = declRecord.init as Node | null;

				if (id.type === 'Identifier') {
					const name = (id as unknown as Record<string, unknown>)
						.name as string;
					registerDeclaration(name, kind, id, init, scope);
				}

				// Walk the init expression (reads, not declaration)
				if (init) {
					walkScope(init, scope, false, false);
				}
			}
			break;
		}

		case 'AssignmentExpression': {
			const left = record.left as Node;
			const right = record.right as Node;
			const operator = record.operator as string;
			const isCompound = operator !== '=';

			// Walk the left side as an assignment target
			walkScope(left, scope, true, isCompound);

			// Walk the right side normally (reads)
			walkScope(right, scope, false, false);
			break;
		}

		case 'UpdateExpression': {
			// ++x or x++ — both a read and a write
			const argument = record.argument as Node;
			if (argument.type === 'Identifier') {
				const name = (argument as unknown as Record<string, unknown>)
					.name as string;
				const decl = lookupDeclaration(name, scope);
				if (decl) {
					decl.readCount += 1;
					decl.writeCount += 1;
				}
			} else {
				walkScope(argument, scope, false, false);
			}
			break;
		}

		case 'MemberExpression': {
			// Walk the object — it's a reference
			const object = record.object as Node;
			walkScope(object, scope, isAssignmentTarget, isCompoundAssignment);

			// Only walk the property if computed (bracket access)
			const computed = record.computed as boolean;
			if (computed) {
				const property = record.property as Node;
				walkScope(property, scope, false, false);
			}
			// Non-computed property names are NOT identifier references
			break;
		}

		case 'Property': {
			const computed = record.computed as boolean;
			if (computed) {
				const key = record.key as Node;
				walkScope(key, scope, false, false);
			}
			const value = record.value as Node;
			walkScope(value, scope, false, false);
			break;
		}

		case 'Identifier': {
			const name = record.name as string;
			const decl = lookupDeclaration(name, scope);
			if (!decl) {
				break; // Not a declared variable — ignore
			}

			if (isAssignmentTarget) {
				decl.writeCount += 1;
				if (isCompoundAssignment) {
					decl.readCount += 1;
				}
			} else {
				decl.readCount += 1;
			}
			break;
		}

		case 'WithStatement': {
			// Walk the object expression normally
			const object = record.object as Node;
			walkScope(object, scope, false, false);

			// Walk the body — with introduces dynamic scope but we
			// still track what we can statically
			const body = record.body as Node;
			walkScope(body, scope, false, false);
			break;
		}

		default: {
			for (const child of getChildNodes(node)) {
				walkScope(child, scope, false, false);
			}
			break;
		}
	}
}

// ─── Conversion: mutable → frozen ──────────────────────────

/**
 * Converts a mutable scope tree to the frozen ScopeInfo tree,
 * collecting all declarations along the way.
 */
function convertScope(
	mutable: MutableScope,
	allDeclarations: DeclarationInfo[],
): ScopeInfo {
	const declarations = new Map<string, DeclarationInfo>();
	for (const [name, decl] of mutable.declarations) {
		const frozen: DeclarationInfo = {
			name: decl.name,
			kind: decl.kind,
			node: decl.node,
			initNode: decl.initNode,
			readCount: decl.readCount,
			writeCount: decl.writeCount,
			scopeDepth: decl.scopeDepth,
		};
		declarations.set(name, frozen);
		allDeclarations.push(frozen);
	}

	const children = mutable.children.map((child) =>
		convertScope(child, allDeclarations),
	);

	const scope: ScopeInfo = {
		kind: mutable.kind,
		node: mutable.node,
		parent: null, // patched below
		declarations,
		children,
	};

	// Patch parent pointers on children
	for (const child of children) {
		(child as { parent: ScopeInfo | null }).parent = scope;
	}

	return scope;
}

/**
 * Freezes the scope tree without recursing into AST nodes.
 *
 * @remarks `deepFreezeInPlace` cannot be used here because:
 * 1. `ScopeInfo.parent` creates circular references
 * 2. AST `Node` objects may have their own circular refs
 * This function freezes only the structures we own.
 */
function freezeScopeTree(scope: ScopeInfo): void {
	for (const decl of scope.declarations.values()) {
		Object.freeze(decl);
	}
	Object.freeze(scope.declarations);

	for (const child of scope.children) {
		freezeScopeTree(child);
	}
	Object.freeze(scope.children);
	Object.freeze(scope);
}

// ─── Main function ─────────────────────────────────────────

/**
 * Builds a complete scope analysis from a parsed AST.
 *
 * @remarks Pure function. Takes an acorn AST (parsed with
 * `locations: true`). Returns a deeply frozen `ScopeAnalysis`
 * containing the scope tree and a flat list of all declarations
 * with their reference counts.
 *
 * @param ast - The root AST node (typically `Program`).
 * @returns A frozen `ScopeAnalysis`.
 */
function buildScope(ast: Node): ScopeAnalysis {
	const rootScope: MutableScope = {
		kind: 'program',
		node: ast,
		parent: null,
		declarations: new Map(),
		children: [],
		depth: 0,
	};

	walkScope(ast, rootScope, false, false);

	const allDeclarations: DeclarationInfo[] = [];
	const root = convertScope(rootScope, allDeclarations);

	freezeScopeTree(root);
	Object.freeze(allDeclarations);

	const analysis: ScopeAnalysis = {
		root,
		allDeclarations,
	};

	return Object.freeze(analysis);
}

export default buildScope;
