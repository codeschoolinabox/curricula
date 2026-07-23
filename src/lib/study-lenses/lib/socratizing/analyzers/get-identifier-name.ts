/**
 * @file Extracts the name from an Identifier AST node.
 *
 * @remarks Returns the string name if the node is an Identifier,
 * null otherwise. Used by analyzers that need to inspect variable
 * or property names.
 */

import type { Node } from 'acorn';

import getRecord from './get-record.js';

export default function getIdentifierName(node: Node): string | null {
	if (node.type === 'Identifier') {
		return getRecord(node).name as string;
	}
	return null;
}
