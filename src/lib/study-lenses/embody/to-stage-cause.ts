// cspell:ignore Failable

import type { Position } from 'acorn';

import type { FailableStageName, StageCause } from './types.js';

/**
 * Build the structured cause a failed stage carries from a thrown parser
 * error, tagged with the stage that failed.
 *
 * @remarks
 * The cause keeps the parser's voice: the message travels verbatim, with the
 * offset and position the machine reports when it reports them.
 */
export default function toStageCause(
	error: unknown,
	stage: FailableStageName,
): StageCause {
	// acorn throws SyntaxError decorated with `pos` (source offset) and `loc`
	// (line/column) — neither typed on the error: an untyped-library boundary
	// read.
	const acornError = error as SyntaxError & { pos?: number; loc?: Position };
	return {
		stage,
		// the cast cannot make a non-Error throw carry `.message` — read it only
		// from a real Error, else stringify (the contract requires a string)
		message: error instanceof Error ? error.message : String(error),
		// compared to `undefined`, not truthiness — a truthy spread would drop
		// offset 0, which the parser reports whenever the failure opens the
		// source.
		...(acornError.pos === undefined ? {} : { offset: acornError.pos }),
		// project loc to a plain pair — acorn's Position instance carries an
		// `offset()` method the contract does not declare; expose the fields the
		// contract owns, never the foreign instance.
		...(acornError.loc
			? {
					position: {
						line: acornError.loc.line,
						column: acornError.loc.column,
					},
				}
			: {}),
	};
}
