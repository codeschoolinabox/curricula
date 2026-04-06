/**
 * @file Design discussion: syntax-aligned trace configuration.
 *
 * This file is NOT used by the tracer — it's a design document.
 * Edit the types and comments to discuss the config shape.
 *
 * Principle: config mirrors the reference.md cheatsheet.
 * Learners select language features, not Aran hook categories.
 *
 * Convention: `feature: true` expands to all sub-options enabled.
 * `feature: { sub: true, other: false }` gives fine control.
 */

// === OPEN QUESTIONS (answer in comments, delete when resolved) ===

// TODO: control flow at top level (if, while, for) or nested under controlFlow: {}?
//   top-level is flatter, more cheatsheet-like
//   nested is more organized, fewer top-level keys
//   → your preference?

// TODO: should string methods be under functionCalls (with filter),
//   or separate because learners think of them as "string stuff"?

// TODO: syntaxId format on events — counter? path? opaque number?

// TODO: body begin/end markers — controlled by scope config? control flow config? both?

// TODO: `declare` event — is this a syntax event (the `let x` line) or a
//   scope event (hoisting)? If scope, does the `let x = 5` syntax event
//   start at evaluate(5) not declare(x)?

// === THE CONFIG TYPE ===

type TraceConfig = {
	// --- execution limits (not trace config, but lives here for API convenience) ---
	seconds?: number;
	iterations?: number;

	// --- variables ---
	// TODO: rename to `variables`? current is `bindings`. variables is more learner-facing.
	variables?: boolean | {
		let?: boolean;
		const?: boolean;
		// TODO: are these the right semantic groupings?
		lifecycle?: boolean;      // declare, initialize, available
		assignments?: boolean;    // assign (x = 2 after initialization)
		reads?: boolean;          // read (using x in an expression)
		filter?: string[];        // only trace these variable names
	};

	// --- literals ---
	literals?: boolean | {
		string?: boolean;
		number?: boolean;
		boolean?: boolean;
		null?: boolean;
		undefined?: boolean;
		regex?: boolean;
	};

	// --- operators ---
	// TODO: group by what you see in the cheatsheet?
	//   or by semantic behavior (pure vs short-circuiting)?
	//   the cheatsheet groups: arithmetic, comparison, logical, bitwise, typeof
	//   the semantic groups: pure (always eval both sides), short-circuit (maybe skip right)
	//   → recommendation: cheatsheet groups for config, semantic tags on the events
	operators?: boolean | {
		arithmetic?: boolean;     // +, -, *, /, %, **
		comparison?: boolean;     // ===, !==, >, <, >=, <=
		logical?: boolean;        // &&, ||, ??, !, ?:
		bitwise?: boolean;        // &, |, ^, ~, <<, >>
		typeof?: boolean;         // typeof
		compound?: boolean;       // +=, -=, *=, etc. — the compound assignment operators
		// TODO: should compound (+=) be here or under variables.assignments?
		//   syntactically it's an operator. semantically it's read + op + assign.
		//   where does the learner expect to find it?
		filter?: string[];        // only trace these operators
	};

	// --- control flow ---
	// TODO: flat (each at top level) or grouped under controlFlow?
	if?: boolean | {
		test?: boolean;           // the condition evaluation
		branch?: boolean;         // which branch taken (consequent/alternate)
	};

	while?: boolean | {
		test?: boolean;           // condition check (each iteration)
		body?: boolean;           // begin/end markers for the loop body
		// TODO: iteration event? or is that implied by body begin/end?
	};

	doWhile?: boolean | {
		body?: boolean;
		test?: boolean;
	};

	for?: boolean | {
		init?: boolean;           // the initialization (let i = 0)
		test?: boolean;           // the condition check
		increment?: boolean;      // the update (i += 1)
		body?: boolean;           // begin/end markers
	};

	forOf?: boolean | {
		iteration?: boolean;      // each iteration (with value and variable)
		body?: boolean;           // begin/end markers
	};

	break?: boolean;
	continue?: boolean;

	// --- templates ---
	templates?: boolean | {
		begin?: boolean;          // template starts, shows string parts
		evaluation?: boolean;     // each ${} expression evaluated
		end?: boolean;            // final assembled string
	};

	// --- property access ---
	propertyAccess?: boolean | {
		dot?: boolean;            // obj.prop
		bracket?: boolean;        // obj[expr]
		optionalChaining?: boolean; // obj?.prop
		filter?: string[];        // only these property names
	};

	// --- function calls ---
	// TODO: this covers console.log, String(), Number(), Math.floor(),
	//   string methods like .toUpperCase(), etc.
	//   should string methods be a separate config key?
	functionCalls?: boolean | {
		call?: boolean;           // function called (name + args)
		return?: boolean;         // function returned (name + value)
		filter?: string[];        // only these function names
	};

	// --- scopes ---
	// TODO: are scopes useful for learners? or is this more of a
	//   "developer tool" concern? the body begin/end on control flow
	//   might replace the need for explicit scope events.
	scopes?: boolean | {
		lifecycle?: boolean;      // create, enter, completion, leave
		interrupt?: boolean;      // break or error interrupted the scope
	};
};

// === EVENT SHAPE (rough sketch) ===

// Every event gets these fields:
// - step: number (contiguous, 1-indexed)
// - syntaxId: ??? (links to the syntax construct this event belongs to)
// - category: string (the config key that enabled this event)
// - semantics: 'statement' | 'expression'
// - loc: { start: { line, column }, end: { line, column } }
// - node: string (ESTree node type)
// - source: string (the source text of this syntax)

// TODO: should syntaxId be:
//   (a) an auto-incrementing counter (simple, opaque)
//   (b) a path like "for-1.body.let-x" (readable but fragile)
//   (c) the AST node's start position "3:0" (stable, unique)
//   → recommendation: (a) counter, with a separate syntaxMap for lookups

// TODO: should events carry a `breakdown` summary field?
//   e.g., on the first event of a `+=` sequence:
//   { syntaxSummary: 'x += 2', syntaxSteps: ['read', 'add', 'assign'] }
//   or is this purely a consumer concern?

export type { TraceConfig };
