import deepFreezeExcept from '@utils/deep-freeze-except.js';

import type { LanguageLevel } from '../../../language-levels/types.js';

import type {
	AssembledParseFacts,
	LevelVerdict,
	MemoizedValidate,
} from './types.js';

/**
 * Create the library's one memoization boundary: a validate that answers
 * every registered level's verdict for the settled snippet, consulting each
 * level exactly once per settle.
 *
 * @remarks
 * One instance per mounted component — the top component holds it, so no
 * memoized truth leaks across instances. Within one settle identity (source
 * and type), repeated reads return the same frozen record without consulting
 * any level again; a new identity validates fresh and replaces the held
 * record wholesale. An unparsed settle (the `null` assembly) consults no
 * level: every verdict is undetermined by this caller's own hand. A throwing
 * validator is caught, reported loudly as a defect — unconditionally, not
 * development-gated, because a validator defect misleads every level surface
 * at once — and answers undetermined for that level alone.
 *
 * @returns The memoized validate this instance holds.
 */
export default function createMemoizedValidate(): MemoizedValidate {
	// The single-slot memo — a mutable closure by design: the memoization
	// boundary IS this state (the per-instance stateful-factory pattern the
	// event bus set the precedent for; the DEV.md § 8 stateful exception).
	// One held settle; a new identity replaces it wholesale, so nothing
	// accumulates across an editing session.
	let held: {
		source: string;
		type: string;
		record: ReturnType<MemoizedValidate>;
	} | null = null;

	return function memoizedValidate(settled, assembled, levels) {
		// 1. The held settle answers — no level consulted again.
		if (
			held !== null &&
			held.source === settled.source &&
			held.type === settled.type
		) {
			return held.record;
		}

		// 2. A new settle: every registered level answers once. The record and
		// its verdicts freeze here; each validated verdict's violations stay
		// the level's own (freeze-what-you-own).
		const record = Object.fromEntries(
			levels.map((level) => [level.key, answerVerdict(assembled, level)]),
		);
		const levelOwned = new Set<object>(
			Object.values(record).flatMap((verdict) =>
				verdict.kind === 'validated' ? [verdict.violations] : [],
			),
		);
		const frozen = deepFreezeExcept(record, levelOwned);

		held = { source: settled.source, type: settled.type, record: frozen };
		return frozen;
	};
}

// One level's answer for one settle. Unparsed consults nobody — the
// undetermined verdict is this caller's own. A throwing validator is caught
// and reported unconditionally (a validator defect misleads every level
// surface at once), answering undetermined for that level alone. Verdicts
// return unfrozen: the caller's one record-level freeze reaches every
// verdict it does not except.
function answerVerdict(
	assembled: AssembledParseFacts,
	level: LanguageLevel,
): LevelVerdict {
	if (assembled === null) {
		return { kind: 'undetermined' };
	}

	try {
		return { kind: 'validated', violations: level.validate(assembled) };
	} catch (error: unknown) {
		console.error(
			`level validator threw — level "${level.key}" answers undetermined:`,
			error,
		);
		return { kind: 'undetermined' };
	}
}
