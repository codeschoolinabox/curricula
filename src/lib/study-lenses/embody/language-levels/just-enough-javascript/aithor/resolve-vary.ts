import type { Program } from 'acorn';

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import parseProgram from '../../../lib/parse-old/parse-program.js';

import features from './features.js';
import metrics from './metrics.js';
import type {
	FeatureSubset,
	ResolvedVary,
	SizeBounds,
	SoftAspect,
	VaryConfig,
} from './types.js';

const { ALL_FEATURES, inventoryFeatures } = features;
const { countLines, maxNestingDepth } = metrics;

/** The soft aspects, in canonical field order — the order `softHolds` emits. */
const SOFT_ASPECTS: readonly SoftAspect[] = [
	'behavior',
	'strategy',
	'implementation',
];

/**
 * Compiles a {@link VaryConfig} down to the existing primitives against a seed —
 * the pure, synchronous resolution prelude. A hard aspect (`languageLevel`,
 * `size`) held (`=== false`) reads the seed's feature inventory / size off its
 * AST into a {@link FeatureSubset} / {@link SizeBounds} the conformance gate and
 * prompt already consume; a soft aspect held adds its name to `softHolds` (the
 * build-prompt tier renders it). An aspect that is `true` or absent is FREED.
 *
 * @remarks
 * Pure and sync — no model, no seam. Parses the seed ONCE via `parseProgram`
 * (which never throws), then measures with the SAME detectors `conform` gates by
 * (the shared {@link features} / {@link metrics} modules), so a held variation
 * conforms to its own seed by construction.
 *
 * Increment 1 assumes a parseable, non-empty seed (the bad-seed branch is a
 * marked stub). The precondition throws — a hard hold on an empty or unparseable
 * seed, and `vary` declared beside a raw `include`/`exclude`/`lines`/`complexity`
 * — are increment 2.
 */
export default function resolveVary(
	seed: string,
	vary: VaryConfig,
): ResolvedVary {
	const parsed = parseProgram(seed, 'module');
	if ('message' in parsed) {
		// Increment 2 replaces this with the real precondition: a typed request-
		// boundary error thrown before bring-up (a hard hold cannot inventory or
		// measure a seed that will not parse). This stub only satisfies the Program
		// narrowing; inc 1 exercises good seeds only, so the inc-1 tests never reach it.
		throw new Error(
			'vary: hard hold needs a parseable seed (precondition — increment 2)',
		);
	}

	// Frozen before leaving the boundary (DEV.md §13): inc 4 wires this into the
	// live request path, where a mutable subset/softHolds could be silently altered.
	return deepFreezeInPlace({
		subset: resolveSubset(parsed, vary),
		size: resolveSize(seed, parsed, vary),
		softHolds: SOFT_ASPECTS.filter((aspect) => vary[aspect] === false),
	});
}

/**
 * Held `languageLevel` → the seed's feature inventory as an allow-list. A
 * non-empty inventory permits exactly those; an EMPTY inventory (a seed of plain
 * statements) → the exclude-all idiom, which `resolvePermitted` reads as
 * permit-none and the prompt renders as "simple statements only" — never the
 * forbid-everything nonsense an empty `include` with a full `exclude` gives.
 * Freed → the all-permitting empty subset.
 */
function resolveSubset(ast: Program, vary: VaryConfig): FeatureSubset {
	if (vary.languageLevel !== false) return { include: [], exclude: [] };

	const inventory = inventoryFeatures(ast);
	if (inventory.length === 0) {
		return { include: ALL_FEATURES, exclude: ALL_FEATURES };
	}
	return { include: inventory, exclude: [] };
}

/**
 * Held `size` → the seed's line count and nesting depth as `≤` maxima (the
 * output may be smaller, never larger). Freed → no bounds.
 */
function resolveSize(seed: string, ast: Program, vary: VaryConfig): SizeBounds {
	if (vary.size !== false) return {};
	return { lines: countLines(seed), complexity: maxNestingDepth(ast) };
}
