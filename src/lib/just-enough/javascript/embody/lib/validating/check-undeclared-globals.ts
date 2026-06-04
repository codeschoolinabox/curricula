import type { Node } from 'acorn';

import buildNodePathMap from '../parse-old/build-node-path-map.js';
import getChildNodes from '../parse-old/get-child-nodes.js';
import buildScope from '../scope/build-scope.js';
import type { ScopeInfo } from '../scope/types.js';

import createViolation from './create-violation.js';
import type { Violation } from './types.js';

/** Known JavaScript built-in globals. Identifiers in this set that are NOT
 * in the language level's `allowedGlobals` produce a rejection. Identifiers
 * NOT in this set pass through to runtime — typos get ReferenceError.
 *
 * Does not need to be exhaustive — missing entries safely pass to runtime. */
const KNOWN_JS_GLOBALS: ReadonlySet<string> = Object.freeze(
	new Set([
		// Constructors / namespaces
		'Object',
		'Function',
		'Array',
		'Number',
		'String',
		'Boolean',
		'Symbol',
		'BigInt',
		'Date',
		'RegExp',
		'Error',
		'TypeError',
		'RangeError',
		'ReferenceError',
		'SyntaxError',
		'URIError',
		'EvalError',
		'AggregateError',
		'Map',
		'Set',
		'WeakMap',
		'WeakSet',
		'WeakRef',
		'FinalizationRegistry',
		'Promise',
		'Proxy',
		'Reflect',
		'JSON',
		'Math',
		'Intl',
		'ArrayBuffer',
		'SharedArrayBuffer',
		'DataView',
		'Atomics',
		'Int8Array',
		'Uint8Array',
		'Uint8ClampedArray',
		'Int16Array',
		'Uint16Array',
		'Int32Array',
		'Uint32Array',
		'Float32Array',
		'Float64Array',
		'BigInt64Array',
		'BigUint64Array',
		'Iterator',
		'AsyncIterator',
		// Global functions
		'parseInt',
		'parseFloat',
		'isNaN',
		'isFinite',
		'encodeURI',
		'encodeURIComponent',
		'decodeURI',
		'decodeURIComponent',
		'escape',
		'unescape',
		'btoa',
		'atob',
		'setTimeout',
		'setInterval',
		'clearTimeout',
		'clearInterval',
		'requestAnimationFrame',
		'cancelAnimationFrame',
		'queueMicrotask',
		'structuredClone',
		'fetch',
		'AbortController',
		'AbortSignal',
		// Browser globals
		'window',
		'self',
		'globalThis',
		'document',
		'navigator',
		'location',
		'history',
		'screen',
		'localStorage',
		'sessionStorage',
		'indexedDB',
		'XMLHttpRequest',
		'Worker',
		'WebSocket',
		'EventSource',
		// DOM
		'Element',
		'HTMLElement',
		'Node',
		'NodeList',
		'Event',
		'CustomEvent',
		'MutationObserver',
		'IntersectionObserver',
		'ResizeObserver',
		// Web APIs
		'URL',
		'URLSearchParams',
		'Headers',
		'Request',
		'Response',
		'FormData',
		'Blob',
		'File',
		'FileReader',
		'TextEncoder',
		'TextDecoder',
		'crypto',
		'performance',
		'ReadableStream',
		'WritableStream',
		'TransformStream',
	]),
);

// ─── Scope lookup helpers ──────────────────────────────────

/**
 * Finds the child scope whose AST node matches the given node.
 * Falls back to the parent scope if no child matches (e.g.,
 * a ForOfStatement body block that was merged into the for-of scope).
 */
function findChildScope(node: Node, parentScope: ScopeInfo): ScopeInfo {
	return parentScope.children.find((c) => c.node === node) ?? parentScope;
}

/**
 * Checks if a name is declared in the scope chain from the given
 * scope upward.
 */
function isNameDeclared(name: string, scope: ScopeInfo): boolean {
	let current: ScopeInfo | null = scope;
	while (current) {
		if (current.declarations.has(name)) {
			return true;
		}
		current = current.parent;
	}
	return false;
}

// ─── Main function ─────────────────────────────────────────

/**
 * Performs scope analysis on a parsed AST to detect disallowed globals.
 *
 * @remarks Uses the shared scope module (`scope/build-scope.ts`) for
 * all declaration tracking, then walks the AST checking identifiers
 * against the scope chain. Flags known JavaScript built-in globals
 * (from `KNOWN_JS_GLOBALS`) that are not in `allowedGlobals`.
 * Unknown identifiers pass through to runtime.
 *
 * JeJ's subset has no functions, classes, or catch clauses — only
 * `let`/`const` in blocks and for-of heads create scopes.
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
	const analysis = buildScope(ast);
	const nodePathMap = buildNodePathMap(ast);
	const violations: readonly Violation[] = [];

	walkForGlobals(
		ast,
		analysis.root,
		allowedGlobals,
		violations,
		false,
		nodePathMap,
	);

	return Object.freeze(violations);
}

// ─── AST walk ──────────────────────────────────────────────

/**
 * Walks the AST carrying a pre-built ScopeInfo reference.
 *
 * @remarks The scope tree was built by `buildScope`. This walk
 * matches AST nodes to their corresponding scope by reference
 * equality (`ScopeInfo.node === node`), then checks identifiers
 * against the scope chain for undeclared globals.
 *
 * `insideWith` suppresses disallowed-global rejections inside
 * `with` statement bodies. `with` introduces dynamic scope —
 * static analysis can't know what properties the `with` object
 * injects, so we suppress checks inside the body.
 *
 * `nodePathMap` is forwarded unchanged through the recursion; the
 * Identifier case looks up the offending node's `Violation.nodePath`
 * from it. The map (a constant) is threaded rather than a computed
 * path so this walk's scope-aware, non-uniform recursion stays
 * unchanged apart from the single lookup.
 */
function walkForGlobals(
	node: Node,
	scope: ScopeInfo,
	allowedGlobals: ReadonlySet<string>,
	violations: readonly Violation[],
	insideWith: boolean,
	nodePathMap: ReadonlyMap<Node, string>,
): void {
	const record = node as unknown as Record<string, unknown>;

	switch (node.type) {
		case 'Program': {
			for (const child of getChildNodes(node)) {
				walkForGlobals(
					child,
					scope,
					allowedGlobals,
					violations,
					insideWith,
					nodePathMap,
				);
			}
			break;
		}

		case 'BlockStatement': {
			const blockScope = findChildScope(node, scope);
			for (const child of getChildNodes(node)) {
				walkForGlobals(
					child,
					blockScope,
					allowedGlobals,
					violations,
					insideWith,
					nodePathMap,
				);
			}
			break;
		}

		case 'WithStatement': {
			// Walk the object expression in the current scope (it's a read)
			const object = record.object as Node;
			walkForGlobals(
				object,
				scope,
				allowedGlobals,
				violations,
				insideWith,
				nodePathMap,
			);

			// Walk the body with insideWith = true
			const body = record.body as Node;
			walkForGlobals(
				body,
				scope,
				allowedGlobals,
				violations,
				true,
				nodePathMap,
			);
			break;
		}

		case 'ForOfStatement': {
			const forOfScope = findChildScope(node, scope);

			// Walk the right-hand side (iterable) in the PARENT scope
			const right = record.right as Node;
			walkForGlobals(
				right,
				scope,
				allowedGlobals,
				violations,
				insideWith,
				nodePathMap,
			);

			// Walk the body in the for-of scope
			const body = record.body as Node;
			if (body.type === 'BlockStatement') {
				// Don't create another nested scope — use forOfScope directly
				for (const child of getChildNodes(body)) {
					walkForGlobals(
						child,
						forOfScope,
						allowedGlobals,
						violations,
						insideWith,
						nodePathMap,
					);
				}
			} else {
				walkForGlobals(
					body,
					forOfScope,
					allowedGlobals,
					violations,
					insideWith,
					nodePathMap,
				);
			}
			break;
		}

		case 'VariableDeclaration': {
			// Only walk init expressions — ids are declarations, not references.
			// Scope tracking is handled by buildScope.
			const declarators = record.declarations as readonly Node[];
			for (const declarator of declarators) {
				const declRecord = declarator as unknown as Record<string, unknown>;
				const init = declRecord.init as Node | null;
				if (init) {
					walkForGlobals(
						init,
						scope,
						allowedGlobals,
						violations,
						insideWith,
						nodePathMap,
					);
				}
			}
			break;
		}

		case 'MemberExpression': {
			// Walk the object — it's a reference
			const object = record.object as Node;
			walkForGlobals(
				object,
				scope,
				allowedGlobals,
				violations,
				insideWith,
				nodePathMap,
			);

			// Only walk the property if computed (bracket access)
			const computed = record.computed as boolean;
			if (computed) {
				const property = record.property as Node;
				walkForGlobals(
					property,
					scope,
					allowedGlobals,
					violations,
					insideWith,
					nodePathMap,
				);
			}
			// Non-computed property names are NOT identifier references
			break;
		}

		case 'Property': {
			// Object literal property — key is a naming position when
			// not computed, not a reference. Only relevant for `with`
			// easter egg since JeJ doesn't allow ObjectExpression.
			const computed = record.computed as boolean;
			if (computed) {
				const key = record.key as Node;
				walkForGlobals(
					key,
					scope,
					allowedGlobals,
					violations,
					insideWith,
					nodePathMap,
				);
			}
			// Always walk the value — it's an expression
			const value = record.value as Node;
			walkForGlobals(
				value,
				scope,
				allowedGlobals,
				violations,
				insideWith,
				nodePathMap,
			);
			break;
		}

		case 'Identifier': {
			const name = record.name as string;

			// User-declared → allowed
			if (isNameDeclared(name, scope)) {
				break;
			}

			// Check allowed globals
			if (allowedGlobals.has(name)) {
				break;
			}

			// Inside `with` body — dynamic scope makes static analysis
			// impossible, so skip the check
			if (insideWith) {
				break;
			}

			// Known JS global NOT in allowedGlobals → rejection.
			// The offending identifier is reachable from the ast the map
			// was built from, so the path lookup is always present
			// (cf. `node.loc!` in extractLocation).
			if (KNOWN_JS_GLOBALS.has(name)) {
				const nodePath = nodePathMap.get(node)!;
				violations.push(
					createViolation(
						'Identifier',
						`'${name}' is not available at this language level`,
						extractLocation(node),
						nodePath,
					),
				);
			}
			// else: unknown identifier → let runtime catch it
			break;
		}

		default: {
			// Generic walk — recurse into all children
			for (const child of getChildNodes(node)) {
				walkForGlobals(
					child,
					scope,
					allowedGlobals,
					violations,
					insideWith,
					nodePathMap,
				);
			}
			break;
		}
	}
}

/**
 * Extracts a source range from an acorn node's `loc` property.
 */
function extractLocation(node: Node) {
	const { loc } = node;
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
