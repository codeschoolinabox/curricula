/**
 * Resolves one lens's configuration from the cascade: the three override
 * layers merge per lens name, weakest first — the host's `configs` prop,
 * then the opening overrides of a recommendation-opened lens, then the
 * learner's session tweaks, always final.
 *
 * @remarks
 * Resolution runs through the lens's own `config` factory when the lens
 * declares one, else through the shared deep-merge — both paths are canon
 * (`Lens.config` in `../../../lenses/types.ts`), not a design choice made
 * here. An override key present with value `undefined` is treated as
 * absent; `null` is a value. The resolved configuration leaves frozen.
 */

import cloneAndFreeze from '@utils/clone-and-freeze.js';
import deepMerge from '@utils/deep-merge.js';

import type {
	Lens,
	LensConfig,
	SerializableValue,
} from '../../../lenses/types.js';

import type { ConfigCascade } from './types.js';

export default function resolveLensConfig(
	lens: Lens,
	cascade: ConfigCascade,
): LensConfig {
	// 1. This lens's slice of each layer, weakest first — an absent layer
	//    entry has nothing to say. An undefined-valued override key is
	//    absent, stripped BEFORE the fold: the shared merge would otherwise
	//    let a literal undefined clobber a weaker layer's value.
	const hostOverrides = stripUndefinedKeys(cascade.host[lens.name] ?? {});
	const openedOverrides = stripUndefinedKeys(cascade.opened[lens.name] ?? {});
	const learnerOverrides = stripUndefinedKeys(cascade.learner[lens.name] ?? {});

	// 2. Fold weakest-first through the shared deep-merge — learner final.
	const overrides = deepMerge(
		deepMerge(hostOverrides, openedOverrides),
		learnerOverrides,
	);

	// 3. The lens's own factory when declared, else the merged cascade
	//    directly (canon: `Lens.config` — defaults live inside the factory;
	//    no factory means no defaults exist).
	const resolved =
		lens.config === undefined ? overrides : lens.config(overrides);

	// 4. Frozen leaving the library — cloned first, because the merge and
	//    the factory can carry caller-owned refs (array values ride by
	//    reference) that an in-place freeze would mutate.
	return cloneAndFreeze(resolved);
}

function stripUndefinedKeys(overrides: Partial<LensConfig>): LensConfig {
	return Object.fromEntries(
		Object.entries(overrides).filter(
			(entry): entry is [string, SerializableValue] => entry[1] !== undefined,
		),
	);
}
