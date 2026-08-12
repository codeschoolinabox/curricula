/**
 * @file Extracts the source offset range of an acorn AST node.
 *
 * @remarks Thin wrapper around acorn's `start`/`end` character offsets, which
 * are present on every node regardless of the `locations` parse option. The
 * returned `{ start, end }` is the zero-indexed, half-open `[start, end)`
 * range each `CodeQuestion` anchors to — see `types.ts`. There is no
 * line/column projection and no fallback: an acorn node always carries its
 * offsets.
 */

import type { Node } from 'acorn';

import freezeInPlace from '@utils/freeze-in-place.js';

/**
 * Extracts the start/end character offsets of an acorn node.
 *
 * @param node - An acorn AST node.
 * @returns A frozen offset range `{ start, end }`.
 */
export default function extractLocation(node: Node): {
	readonly start: number;
	readonly end: number;
} {
	return freezeInPlace({ start: node.start, end: node.end });
}
