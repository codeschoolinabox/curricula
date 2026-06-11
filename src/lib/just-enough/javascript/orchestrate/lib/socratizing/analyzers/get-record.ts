/**
 * @file Casts an acorn Node to a record for property access.
 *
 * @remarks Acorn's Node type is minimal (type, start, end, loc).
 * ESTree properties (e.g., kind, declarations, operator) require
 * casting. This helper avoids repeating the cast in every analyzer.
 */

import type { Node } from 'acorn';

export default function getRecord(node: Node): Record<string, unknown> {
	return node as unknown as Record<string, unknown>;
}
