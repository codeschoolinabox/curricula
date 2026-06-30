import type { VaryConfig } from './types.js';

/**
 * Whether a {@link VaryConfig} DECLARES an aspect — at least one of its five keys
 * is present (freed or held); only `vary: {}` declares nothing. The single shared
 * predicate the mutual-exclusivity guard (a declaring vary forbids a raw
 * constraint) and the orchestrator's resolve-gate (only a declaring vary compiles
 * into holds; `vary: {}` is inert) both turn on, so the two cannot drift apart.
 */
export default function varyDeclaresAspect(vary: VaryConfig): boolean {
	return Object.values(vary).some((value) => value !== undefined);
}
