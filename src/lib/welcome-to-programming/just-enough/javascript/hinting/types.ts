/**
 * @file Types for the hinting module.
 *
 * @remarks The hinting module calls `validate()` first (early
 * return if code isn't valid JeJ), then runs warning detection
 * and checks formatting status. The result combines all three
 * concerns into a single pre-execution analysis snapshot.
 *
 * Re-exports {@link HintResult} from api/types.ts — the type
 * lives there because it's part of the public API contract.
 */

export type { HintResult } from '../api/types.js';
