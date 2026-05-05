/**
 * @file Pre-execution AST walk: wrap every CallExpression with the
 *   intercept worker's `__$ic` helper so trap functions can read the
 *   exact firing nodePath without parsing `Error.stack`.
 *
 * Input: an acorn `Program` (with `locations: true`) plus the original
 * source string. Output: the rewritten source string with every
 * CallExpression `<callee>(<args>)` replaced by
 * `__$ic('<nodePath>', () => <callee>(<args>))`.
 *
 * Properties:
 * - **Lines preserved 1:1** — replacements stay on the same line as the
 *   original call (no newlines added inside the wrap).
 * - **`this`-binding preserved** — the original call expression appears
 *   verbatim inside the arrow body, so `obj.method()` keeps `obj` as
 *   its receiver.
 * - **Nesting safe** — a depth-first bottom-up rewrite means inner
 *   CallExpressions are rewritten BEFORE their containing outer ones,
 *   so each outer wrap contains the already-wrapped inner text. No
 *   offset bookkeeping needed across overlapping spans.
 * - **Unrelated calls (Math.X, String.X, user expressions) are wrapped
 *   too** — harmless. Only the trap functions (console.X, prompt,
 *   alert, confirm) READ `__currentPath` and emit events.
 *
 * The helper name `__$ic` is chosen to be unlikely to collide with
 * JeJ-allowed identifiers (camelCase). A future validation rule could
 * reject any user reference to it for friendlier errors.
 */

import type { Node, Program } from 'acorn';

import HELPER_NAME from './wrap-helper-name.js';

const META_KEYS = new Set(['type', 'start', 'end', 'loc']);

function isAcornNode(value: unknown): value is Node {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as { type?: unknown }).type === 'string'
	);
}

type CallChild = {
	readonly node: Node;
	readonly path: string;
};

/**
 * Walks `node`'s children and collects the SHALLOWEST CallExpression
 * descendants — i.e. CallExpressions that are descendants of `node`
 * but NOT descendants of any intermediate CallExpression. The caller
 * recurses into those CallExpressions to handle deeper nesting,
 * keeping the rewrite strictly bottom-up.
 */
function findTopmostCallDescendants(
	node: Node,
	basePath: string,
	results: CallChild[],
): void {
	for (const key of Object.keys(node)) {
		if (META_KEYS.has(key)) continue;

		const value = (node as unknown as Record<string, unknown>)[key];

		if (Array.isArray(value)) {
			for (let i = 0; i < value.length; i++) {
				const item = value[i];
				if (isAcornNode(item)) {
					const childPath = `${basePath}.${key}.${i}`;
					if (item.type === 'CallExpression') {
						results.push({ node: item, path: childPath });
					} else {
						findTopmostCallDescendants(item, childPath, results);
					}
				}
			}
		} else if (isAcornNode(value)) {
			const childPath = `${basePath}.${key}`;
			if (value.type === 'CallExpression') {
				results.push({ node: value, path: childPath });
			} else {
				findTopmostCallDescendants(value, childPath, results);
			}
		}
	}
}

/**
 * Returns the rewritten text for a CallExpression: the original
 * `<callee>(<args>)` with every nested CallExpression itself rewritten,
 * then wrapped in `__$ic('nodePath', () => ...)`.
 */
function rewriteCallExpression(
	node: Node,
	path: string,
	source: string,
): string {
	const inner: CallChild[] = [];
	findTopmostCallDescendants(node, path, inner);
	inner.sort((a, b) => (a.node as { start: number }).start - (b.node as { start: number }).start);

	const nodeStart = (node as { start: number }).start;
	const nodeEnd = (node as { end: number }).end;

	let result = '';
	let i = nodeStart;
	for (const child of inner) {
		const childStart = (child.node as { start: number }).start;
		const childEnd = (child.node as { end: number }).end;
		result += source.slice(i, childStart);
		result += rewriteCallExpression(child.node, child.path, source);
		i = childEnd;
	}
	result += source.slice(i, nodeEnd);

	return `${HELPER_NAME}(${JSON.stringify(path)}, () => ${result})`;
}

/**
 * Walks the AST and wraps every CallExpression. Returns the rewritten
 * source string. Lines are preserved 1:1 with the input.
 */
function wrapCallExpressions(program: Program, source: string): string {
	const topmost: CallChild[] = [];
	findTopmostCallDescendants(program, '$', topmost);
	topmost.sort((a, b) => (a.node as { start: number }).start - (b.node as { start: number }).start);

	let result = '';
	let i = 0;
	for (const child of topmost) {
		const childStart = (child.node as { start: number }).start;
		const childEnd = (child.node as { end: number }).end;
		result += source.slice(i, childStart);
		result += rewriteCallExpression(child.node, child.path, source);
		i = childEnd;
	}
	result += source.slice(i);

	return result;
}

export default wrapCallExpressions;
