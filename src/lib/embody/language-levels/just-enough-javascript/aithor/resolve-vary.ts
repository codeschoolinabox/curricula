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
 * A hard hold (`languageLevel`/`size`) reads the seed's inventory / size off its
 * AST, so it needs a parseable, non-empty seed: an empty or unparseable seed under
 * a hard hold throws synchronously (a config-shape error, before the model runs).
 * "Empty" means no content (`seed.trim() === ''`) — a present-but-trivial seed (a
 * lone comment) is measurable to the empty inventory and does not throw. A SOFT
 * hold never throws and never parses (the soft tier is prompt-only; a hold with no
 * seed to reference is a vacuous instruction the model ignores), and `vary: {}` is
 * the from-scratch base case. The sibling `vary`-beside-raw mutual-exclusivity
 * throw lives in `assertVaryExclusive` (it needs the whole config).
 */
export default function resolveVary(
	seed: string,
	vary: VaryConfig,
): ResolvedVary {
	const softHolds = SOFT_ASPECTS.filter((aspect) => vary[aspect] === false);
	const anyHardHold = vary.languageLevel === false || vary.size === false;

	if (anyHardHold) {
		if (seed.trim() === '') {
			throw new Error(
				'vary: a hard hold (languageLevel/size) needs a non-empty seed to read off',
			);
		}
		const parsed = parseProgram(seed, 'module');
		if ('message' in parsed) {
			throw new Error(
				'vary: a hard hold (languageLevel/size) needs a parseable seed to read off',
			);
		}
		// Frozen before leaving the boundary (DEV.md §13): inc 4 wires this into the
		// live request path, where a mutable subset/softHolds could be silently altered.
		return deepFreezeInPlace({
			subset: resolveSubset(parsed, vary),
			size: resolveSize(seed, parsed, vary),
			softHolds,
		});
	}

	// No hard hold — the hard tiers are freed; only the soft holds ride the prompt.
	return deepFreezeInPlace({
		subset: { include: [], exclude: [] },
		size: {},
		softHolds,
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
