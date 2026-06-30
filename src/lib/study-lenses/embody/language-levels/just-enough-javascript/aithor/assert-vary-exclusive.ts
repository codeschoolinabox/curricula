import type { AithorConfig } from './types.js';
import varyDeclaresAspect from './vary-declares-aspect.js';

/**
 * The mutual-exclusivity guard — a config-shape throw, synchronous and before the
 * model runs. A {@link VaryConfig} that DECLARES any aspect (any of the five keys
 * present, freed or held — only `vary: {}` declares nothing) is the higher-level
 * way to set the feature subset / size bounds, so pairing it with a raw `include`
 * / `exclude` / `lines` / `complexity` is a contradiction that throws, never a
 * silent override. Reads the RAW config (before `resolveConfig` defaults the
 * subset fields), so an omitted field is `undefined`, distinct from a set one.
 *
 * @remarks
 * The sibling precondition throw (a hard hold needs a parseable, non-empty seed)
 * lives in `resolveVary`, which has the seed; this guard needs the whole config,
 * so it is its own leaf. Both throw at the request boundary, distinct from
 * aithor's value-not-throw OUTCOME boundary (a model/runtime failure is a refusal).
 */
export default function assertVaryExclusive(config: AithorConfig): void {
	const { vary, include, exclude, lines, complexity } = config;
	if (vary === undefined || !varyDeclaresAspect(vary)) return;

	const hasRawConstraint =
		include !== undefined ||
		exclude !== undefined ||
		lines !== undefined ||
		complexity !== undefined;

	if (hasRawConstraint) {
		throw new Error(
			'vary declaring an aspect is mutually exclusive with a raw include/exclude/lines/complexity',
		);
	}
}
