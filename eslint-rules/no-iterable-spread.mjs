/**
 * no-iterable-spread — forbid spreading a non-array iterable into an array
 * literal, because this repo's browser bundle silently mistranspiles it.
 *
 * The Docusaurus/Babel pipeline compiles spread in loose mode ("assume array"),
 * so `[...x]` becomes `[].concat(x)`. `Array.prototype.concat` only flattens
 * real arrays, so a Set, a Map, any iterator (`.entries()`, `.keys()`,
 * `.values()`, a generator) or a string comes out as a ONE-ELEMENT array
 * holding the source object itself:
 *
 *   [...someSet]            -> [].concat(someSet)            // [Set]
 *   [...arr.entries()]      -> [].concat(arr.entries())      // [ArrayIterator]
 *   [...[1, 2, 3]]          -> [1, 2, 3].concat()            // correct
 *   Array.from(someSet)     -> Array.from(someSet)           // correct
 *
 * Nothing in the test harness can see this: vitest runs esbuild, tsc only
 * typechecks, and jsdom renders already-correct code. Unit tests, typecheck and
 * jsdom all stay green while the shipped site silently computes the wrong
 * answer. It has cost this repo three production defects — the event-bus
 * dispatch snapshot (`95d0e66`), the tokens fact stage (which reported `ok` for
 * source that does not lex, because the wrapped tokenizer never ran and so
 * never threw), and embody's own entwining walk (which lost every array-valued
 * AST child). Each was found by accident, months apart. This rule is what
 * replaces the accident.
 *
 * The fix is always `Array.from(x)`, which the pipeline leaves alone.
 *
 * Call spread is covered too, and it fails WORSE. Loose mode compiles `f(...x)`
 * to `f.apply(void 0, x)`; `.apply` reads `length` off its argument, which is
 * `undefined` on a Set or an iterator, so the call happens with ZERO arguments
 * — no error, no trace, every parameter `undefined`. Measured, not assumed:
 * `f(...someSet)` called `f` with no arguments at all, and
 * `arr.push(...someSet)` left `arr` empty.
 *
 * Type-aware by necessity: the hazard is a property of the operand's TYPE, not
 * its syntax, so the rule reads the TypeScript checker — structurally, via
 * `isArrayType`/`isTupleType` and an interface's base types, never by matching
 * the printed type name. A type merely NAMED `Array<T>` prints identically to
 * the global one, and letting a lookalike through is the failure direction that
 * ships a bug rather than an annoyance.
 *
 * Out of scope, by design:
 *   - Object spread (`{ ...x }`) — a different transform that does not use
 *     `concat` or `.apply`.
 *   - Trees ESLint is configured to ignore (`evaluating/intercept`,
 *     `trace/semantics`, `study-lenses--deprecated-architecture`, and the other
 *     WIP paths in the root `ignores`). The rule cannot see them, so its
 *     coverage is "everything ESLint lints", not "everything bundled".
 *   - Files outside the bundled `src/` tree. Tests are bundled by vitest, not
 *     Babel, so the hazard cannot reach them — but the rule does not exempt
 *     them, because a test that spreads a Set is still a test written in a
 *     dialect the source cannot use.
 *
 * Not fixable automatically: swapping to `Array.from` is mechanical, but an
 * autofix here would rewrite the exact construct this repo has already shipped
 * broken three times, and `--fix` is a denied operation in this codebase.
 * Retrofits are done by hand.
 *
 * @module no-iterable-spread
 */

export default {
	meta: {
		type: 'problem',
		docs: {
			description:
				'forbid spreading a non-array iterable into an array literal (Babel loose mode wraps it instead of draining it)',
		},
		schema: [],
		messages: {
			iterableSpread:
				'Spreading `{{type}}` into an array literal is compiled by the Docusaurus/Babel browser build to `[].concat(...)`, which wraps it instead of draining it. Use `Array.from(...)`.',
		},
	},

	create(context) {
		const services = context.sourceCode.parserServices;
		if (!services?.program || !services.esTreeNodeToTSNodeMap) {
			return {};
		}
		const checker = services.program.getTypeChecker();

		const check = (node) => {
			const tsNode = services.esTreeNodeToTSNodeMap.get(node.argument);
			if (!tsNode) return;
			const type = checker.getTypeAtLocation(tsNode);
			if (isRealArray(type, checker)) return;
			context.report({
				node,
				messageId: 'iterableSpread',
				data: { type: checker.typeToString(type) },
			});
		};

		return {
			'ArrayExpression > SpreadElement': check,
			'CallExpression > SpreadElement': check,
			'NewExpression > SpreadElement': check,
		};
	},
};

// Both broken forms key on the same question — is this a REAL array at
// runtime? `[].concat(x)` flattens only a real array, and `f.apply(null, x)`
// reads `length` off one. The judgement is structural, never textual: a
// locally-declared type merely NAMED `Array<T>` prints the same as the global
// one, so matching on `checker.typeToString` output would let a lookalike
// through — the one direction that ships a bug rather than an annoyance.
function isRealArray(type, checker) {
	if (type.isUnion?.()) {
		return type.types.every((member) => isRealArray(member, checker));
	}

	// A type parameter is judged by its CONSTRAINT: `<A extends unknown[]>` is
	// an array at every call site. Unconstrained, it cannot be judged from
	// inside the generic, so it is left alone rather than guessed at.
	if (type.isTypeParameter?.()) {
		const constraint = checker.getBaseConstraintOfType(type);
		return constraint === undefined || isRealArray(constraint, checker);
	}

	if (checker.isArrayType(type) || checker.isTupleType(type)) return true;

	// A named interface that extends Array — `RegExpMatchArray`, and anything
	// declared the same way — IS an array at runtime even though it prints as
	// its own name.
	if (type.isClassOrInterface?.()) {
		const bases = checker.getBaseTypes(type) ?? [];
		if (bases.some((base) => isRealArray(base, checker))) return true;
	}

	return UNRESOLVABLE.has(checker.typeToString(type));
}

// Types the checker cannot resolve to anything actionable. Reporting these
// would fire on code no one can fix, which is how a rule teaches people to
// disable it.
const UNRESOLVABLE = new Set(['any', 'unknown', 'never']);
