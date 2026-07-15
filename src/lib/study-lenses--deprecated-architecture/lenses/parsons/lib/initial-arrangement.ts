import type { Arrangement } from '../types.js';

/**
 * The starting arrangement: all pool ids available, the solution column empty.
 *
 * @param poolIds the shuffled line ids from `ParsedParsons.pool`.
 */
export default function initialArrangement(
	poolIds: ReadonlyArray<string>,
): Arrangement {
	return { pool: [...poolIds], solution: [] };
}
