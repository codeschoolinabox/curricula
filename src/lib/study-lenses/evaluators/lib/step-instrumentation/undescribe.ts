/**
 * The deep snapshot codec, thread side: a described value → a re-minted
 * live-ish value (fresh objects; callable fakes; never-resolving promises;
 * per-call fake constructors — the klve-091 wrinkle under r3; under a CSP
 * without unsafe-eval, class instances degrade to plain objects carrying
 * cname). Adapts klve's undescribe (Kelley van Evert, jsviz.klve.nl).
 *
 * @param described - The [descriptor, heap] pair.
 * @returns The re-minted value; `===` never bridges the wire.
 */
import type { DescribedValue } from './types.js';

export default function undescribe(_described: DescribedValue): unknown {
	throw new Error('not implemented — Phase 1 un-skips the suite');
}
