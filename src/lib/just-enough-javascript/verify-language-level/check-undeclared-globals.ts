import type { Node } from 'acorn';

import createViolation from './create-violation.js';
import getChildNodes from './get-child-nodes.js';

import type { Violation } from './types.js';

/**
 * Scope entry for a declared variable.
 *
 * @remarks Tracks name, declaration location, and read count
 * for unused-variable detection.
 */
type ScopeEntry = {
	readonly name: string;
	readonly node: Node;
	readCount: number;
};

/**
 * A block scope containing variable declarations.
 *
 * @remarks Each scope has a reference to its parent for
 * upward name lookups (undeclared globals, shadowing).
 */
type Scope = {
	readonly declarations: Map<string, ScopeEntry>;
	readonly parent: Scope | null;
};

/**
 * Performs scope analysis on a parsed AST to detect undeclared globals,
 * unused variables, and variable shadowing.
 *
 * @remarks Walks the AST once, maintaining a scope chain. JeJ's subset
 * has no functions, classes, or catch clauses — only `let`/`const` in
 * blocks and for-of heads create scopes.
 *
 * **Scope boundaries:** `Program`, `BlockStatement`, `ForOfStatement`
 *
 * **Positions skipped (not references):**
 * - `VariableDeclarator.id` — declaration, not read
 * - `MemberExpression.property` when `computed: false` — property name
 * - `ForOfStatement.left` — declaration position
 *
 * Returns a frozen array of violations:
 * - `'error'` for undeclared identifiers
 * - `'warning'` for unused variables and shadowing
 *
 * @param ast - The root AST node (typically `Program`).
 * @param allowedGlobals - Set of identifier names that don't need
 *   a `let`/`const` declaration (e.g. `console`, `alert`).
 * @returns A frozen array of scope-related {@link Violation}s.
 */
function checkUndeclaredGlobals(
	ast: Node,
	allowedGlobals: ReadonlySet<string>,
): readonly Violation[] {
	const violations: Violation[] = [];
	const programScope: Scope = { declarations: new Map(), parent: null };

	walkScope(ast, programScope, allowedGlobals, violations, null);

	// after full walk, check for unused variables in program scope
	reportUnused(programScope, violations);

	return Object.freeze(violations);
}

/**
 * Recursive scope-aware AST walk.
 *
 * @remarks `parentContext` indicates the parent node type to handle
 * special positions (VariableDeclarator.id, MemberExpression.property,
 * ForOfStatement.left).
 */
function walkScope(
	node: Node,
	scope: Scope,
	allowedGlobals: ReadonlySet<string>,
	violations: Violation[],
	parentContext: string | null,
): void {
	const record = node as unknown as Record<string, unknown>;

	switch (node.type) {
		case 'Program': {
			// Program scope is already created, just walk children
			for (const child of getChildNodes(node)) {
				walkScope(child, scope, allowedGlobals, violations, 'Program');
			}
			break;
		}

		case 'BlockStatement': {
			const blockScope: Scope = {
				declarations: new Map(),
				parent: scope,
			};
			for (const child of getChildNodes(node)) {
				walkScope(
					child,
					blockScope,
					allowedGlobals,
					violations,
					'BlockStatement',
				);
			}
			reportUnused(blockScope, violations);
			break;
		}

		case 'ForOfStatement': {
			// ForOfStatement creates its own scope for the iteration variable
			const forOfScope: Scope = {
				declarations: new Map(),
				parent: scope,
			};

			// Register the iteration variable declaration
			const left = record.left as Node;
			if (left.type === 'VariableDeclaration') {
				const leftRecord = left as unknown as Record<string, unknown>;
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
						registerDeclaration(
							name,
							id,
							forOfScope,
							scope,
							violations,
						);
					}
				}
			}

			// Walk the right-hand side (iterable) in the PARENT scope
			const right = record.right as Node;
			walkScope(right, scope, allowedGlobals, violations, 'ForOfStatement');

			// Walk the body in the for-of scope
			const body = record.body as Node;
			if (body.type === 'BlockStatement') {
				// Don't create another nested scope — use forOfScope directly
				for (const child of getChildNodes(body)) {
					walkScope(
						child,
						forOfScope,
						allowedGlobals,
						violations,
						'BlockStatement',
					);
				}
			} else {
				walkScope(
					body,
					forOfScope,
					allowedGlobals,
					violations,
					'ForOfStatement',
				);
			}

			reportUnused(forOfScope, violations);
			break;
		}

		case 'VariableDeclaration': {
			const declarators = record.declarations as Node[];
			for (const declarator of declarators) {
				walkScope(
					declarator,
					scope,
					allowedGlobals,
					violations,
					'VariableDeclaration',
				);
			}
			break;
		}

		case 'VariableDeclarator': {
			const id = record.id as Node;
			if (id.type === 'Identifier') {
				const name = (id as unknown as Record<string, unknown>)
					.name as string;
				registerDeclaration(name, id, scope, scope.parent, violations);
			}

			// Walk the init expression (right-hand side) — these are reads
			const init = record.init as Node | null;
			if (init) {
				walkScope(
					init,
					scope,
					allowedGlobals,
					violations,
					'VariableDeclarator',
				);
			}
			break;
		}

		case 'MemberExpression': {
			// Walk the object — it's a reference
			const object = record.object as Node;
			walkScope(
				object,
				scope,
				allowedGlobals,
				violations,
				'MemberExpression',
			);

			// Only walk the property if computed (bracket access)
			const computed = record.computed as boolean;
			if (computed) {
				const property = record.property as Node;
				walkScope(
					property,
					scope,
					allowedGlobals,
					violations,
					'MemberExpression',
				);
			}
			// Non-computed property names are NOT identifier references
			break;
		}

		case 'Identifier': {
			// Skip if this is a declaration position (handled by
			// VariableDeclarator and ForOfStatement cases above)
			if (parentContext === 'VariableDeclaration') {
				// This shouldn't happen — VariableDeclaration walks
				// declarators, not identifiers directly
				break;
			}

			const name = record.name as string;

			// Try to resolve in scope chain
			const entry = lookupScope(name, scope);
			if (entry) {
				entry.readCount += 1;
				break;
			}

			// Check allowed globals
			if (allowedGlobals.has(name)) {
				break;
			}

			// Undeclared — error
			violations.push(
				createViolation(
					'Identifier',
					`'${name}' is not declared — declare it with 'let' or 'const', or check spelling`,
					extractLocation(node),
					'error',
				),
			);
			break;
		}

		default: {
			// Generic walk — recurse into all children
			for (const child of getChildNodes(node)) {
				walkScope(child, scope, allowedGlobals, violations, node.type);
			}
			break;
		}
	}
}

/**
 * Registers a variable declaration in a scope, checking for shadowing.
 */
function registerDeclaration(
	name: string,
	node: Node,
	scope: Scope,
	parentScopeForShadow: Scope | null,
	violations: Violation[],
): void {
	// Check for shadowing — look up in parent scopes only
	if (parentScopeForShadow) {
		const shadowed = lookupScope(name, parentScopeForShadow);
		if (shadowed) {
			violations.push(
				createViolation(
					'Identifier',
					`'${name}' shadows a variable in an outer scope`,
					extractLocation(node),
					'warning',
				),
			);
		}
	}

	scope.declarations.set(name, { name, node, readCount: 0 });
}

/**
 * Looks up a name in the scope chain, returning the entry if found.
 */
function lookupScope(name: string, scope: Scope): ScopeEntry | null {
	let current: Scope | null = scope;
	while (current) {
		const entry = current.declarations.get(name);
		if (entry) {
			return entry;
		}
		current = current.parent;
	}
	return null;
}

/**
 * Reports unused variables in a scope as warnings.
 */
function reportUnused(scope: Scope, violations: Violation[]): void {
	for (const entry of scope.declarations.values()) {
		if (entry.readCount === 0) {
			violations.push(
				createViolation(
					'Identifier',
					`'${entry.name}' is declared but never used`,
					extractLocation(entry.node),
					'warning',
				),
			);
		}
	}
}

/**
 * Extracts a source range from an acorn node's `loc` property.
 */
function extractLocation(node: Node) {
	const loc = node.loc;
	if (loc) {
		return {
			start: { line: loc.start.line, column: loc.start.column },
			end: { line: loc.end.line, column: loc.end.column },
		};
	}
	return {
		start: { line: 1, column: 0 },
		end: { line: 1, column: 0 },
	};
}

export default checkUndeclaredGlobals;
