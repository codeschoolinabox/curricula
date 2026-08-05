import freezeInPlace from '@utils/freeze-in-place.js';

import type { NodeRule } from './types.js';

/**
 * @file The node types an inventory-derived slice must admit, as data — the
 * table a caller unions under its own entries when it derives an allowlist by
 * inventorying an existing program, so the result is not refused for a surface
 * choice the original happened not to make.
 *
 * @remarks
 * Five members, and the absences are the design. The floor's operative test is
 * reachability-completion of an inventory: which types must be admitted so a
 * program holding an existing program's grammar stays admissible. A binding
 * site fails that test — unreachable except under a declaration statement, so
 * admitting it alone suppresses one violation and grants no expressive power,
 * while admitting both would let a variation introduce a binding the held
 * program never had. Declarations therefore come from the inventory itself.
 * The empty statement is excluded on the same test: a bare `;` is never
 * load-bearing. The accepted cost is real — a generator emits one incidentally
 * and such a program is refused.
 *
 * `Extract<NodeRule, true>` derives the admitted-outright value from
 * `types.ts` rather than restating it, so a constraint check here is a compile
 * error. It does NOT make a sixth key one: `Record<string, …>` is an index
 * signature, and excess-property checking cannot fire through it. Membership
 * is guarded at runtime by the suite, not by the type.
 *
 * The leaf publishes this table and never applies it. A published constant is
 * a convention, not an enforcement — nothing compels a caller to union it, and
 * no type expresses the precondition.
 */

const STRUCTURAL_FLOOR = freezeInPlace<Record<string, Extract<NodeRule, true>>>(
	{
		Program: true,
		ExpressionStatement: true,
		BlockStatement: true,
		Identifier: true,
		Literal: true,
	},
);

export default STRUCTURAL_FLOOR;
