/**
 * @file Canonical types for the scoping module.
 *
 * The domain model in TypeScript: the flat, per-declaration usage view of a
 * program's variables that `deriveScopeUsage` produces. `VariableUsage` is one
 * `let`/`const` binding's usage (its name and kind, its post-declaration
 * read/write counts, its declared identifier node, and whether it is exported);
 * `ScopeUsage` gathers them across every scope depth.
 *
 * See `./README.md` for the fold rule (initializer never a write, read-write
 * counts both, member-target reads its object) and the bounded context
 * ("scoping projects; consumers judge").
 */

import type * as acorn from 'acorn';

/**
 * One `let`/`const` binding's usage.
 *
 * `readCount` / `writeCount` are post-declaration reference tallies drawn from
 * embody's access classification; the declaration's own initializer is NOT a
 * write, so a never-reassigned `let` reports `writeCount: 0`. `node` is the
 * declared **identifier** node — embody's `ScopeDefinition.name`, NOT
 * `ScopeDefinition.node` (which is the declarator statement) — carried by
 * reference from the one shared parse so a consumer can match it by identity
 * (`===`), as `caution.ts`'s `unused-variable` check does.
 *
 * `exported` reduces embody's `exportedNames` to the question this leaf's
 * consumers ask: does this name leave the module? A binding that leaves is read
 * from outside it, so a usage-count reading alone would call a module's public
 * API unused. The external names themselves stay on the environment fact, for a
 * consumer that needs them.
 *
 * Named `VariableUsage`, not `DeclarationInfo`, because two live
 * `DeclarationInfo`s already exist and no single adjective separates this from
 * both: the counting declaration-site shape in `embody/lib/scope/types.ts`
 * (still produced by the legacy `build-scope`, whose `ScopeInfo` /
 * `ScopeAnalysis` the trace and validating leaves import), and the count-free
 * one on embody's public contract (`embody/types.ts`). So this type is named
 * for what it PROJECTS — usage — rather than for a differentiator a third
 * homonym could take away.
 */
export type VariableUsage = {
	readonly name: string;
	readonly kind: 'let' | 'const';
	readonly readCount: number;
	readonly writeCount: number;
	readonly node: acorn.Node;
	readonly exported: boolean;
};

/**
 * The flat declaration-usage view: every `let`/`const` `VariableUsage` in the
 * program, regardless of scope depth. The scope tree is deliberately omitted —
 * consumers of this leaf ask declaration-level questions, not scope-nesting
 * ones. The field keeps the historical name `allDeclarations` (what its
 * consumers already read).
 */
export type ScopeUsage = {
	readonly allDeclarations: readonly VariableUsage[];
};
