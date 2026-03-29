/* Aran traps will
  ask me for a unique identifier for each node 
  Aran will provide a stringified JSON path to each node - which is unique
  -> I can just use this

  in pointcut I get the AranLang node, not the ESTree node

  !! each AranLang node will be tagged with the corresponding ESTree unique id

*/

/**
 * @file Default configuration for educational execution tracer
 *
 * Provides the complete default configuration values for configuring what appears in the trace array.
 *
 * @see README.md for comprehensive documentation
 */

const defaultConfig = {
	// --- BINDINGS ---
	// Tracks variable lifecycle: declaration, initialization, writes, and reads.
	// Covers both user-declared variables (let/const) and global bindings.
	//
	// Design: organized by language semantics, not by use-case.
	//   String methods like .slice() compose as: propertyAccess.dot + functions.call
	//   Type conversions like Number('42') compose as: bindings.global read + functions.call
	//   Interactions like prompt() compose as: bindings.global read + functions.call
	bindings: {
		kind: {
			declarative: {
				let: true,
				const: true,
			},
			// Covers prompt, alert, confirm, console, Number, String, Boolean, Number.isNaN
			// In JeJ there are no user-defined functions, only these built-in globals
			global: true,
		},
		events: {
			/**
			 * --- BINDING LIFECYCLE EVENTS ---
			 *
			 * Different presets reveal different lifecycle granularity:
			 *   Beginner sees:    available → write
			 *   Intermediate:     declare → available → write
			 *   Advanced:         declare → available → initialize → write
			 *
			 * EVENT TIMELINE EXAMPLES:
			 *
			 * let y = 5:
			 *   Scope entry → declare (enters TDZ)
			 *   At line     → available + initialize(5)
			 */

			// When binding enters scope (hoisting phase for var/function/let/const)
			// for declarative bindings
			declare: true,

			// When binding becomes usable without error
			// is for implicit too
			available: true,

			// When binding gets its first value _before_ 'available' event
			// - let/const: initialized at declaration line (same time as available)
			// - globals: top of script (? need to double check)
			// ?? flagged in trace as "implicit" if no initialization in code?
			initialize: true,

			// Subsequent value changes after initialization
			// Essential for all presets - tracking value mutations
			// Named "write" to pair with "read" and avoid collision with operators.assignment
			write: true,

			// When binding value is accessed
			// Essential for all presets - tracking data flow
			read: true,
		},
		// if provided as array instead of object, default to inclusion not exclusion
		filter: [],
	},

	// --- PROPERTY ACCESS ---
	// Dot and bracket are semantically distinct:
	//   dot: string key, statically known (e.g. str.length, str.slice)
	//   bracket: computed key, often numeric (e.g. str[0], str[i + 1])
	// Implementation note: check if Aran normalizes these or distinguishes them.
	//   If normalized, we may need AST lookup to recover the distinction.
	propertyAccess: {
		dot: true,
		bracket: true,
		// ?. operator — short-circuits to undefined instead of throwing on null/undefined
		optionalChaining: true,

		filter: [],
	},

	// --- OPERATORS ---
	// Three semantic categories based on what the operator *does*, not how it's used:
	//   pure: produces a new value without side-effects
	//   assignment: requires a variable on the left, modifies its state
	//   shortCircuiting: may skip evaluating the right operand
	//
	// Note: assignment and shortCircuiting overlap for ??=, ||=, &&=
	//   These are classified under "assignment" because the defining behavior is
	//   the state change. The short-circuit evaluation steps are governed by
	//   shortCircuiting independently.
	//
	// JeJ excludes ++/-- — they're shorthand for += 1 / -= 1 with no new mental model.
	operators: {
		pure: true, // +, -, *, /, %, **, ===, !==, <, >, <=, >=, typeof, ! (produce new values without side-effect)
		assignment: true, // =, +=, -=, *=, /=, %=, **=, ??=, ||=, &&= (require a variable on the left and modify its state)
		shortCircuiting: true, // &&, ||, ??, ?: (choose between values — may not evaluate right operand)

		// Whether to log the intermediate coerced values in operations
		// e.g. for `'5' + 3`: trace would show string coercion of 3 → '3' before concatenation
		// Will require a function to generate coerced values for trace log
		// Note: find prior art for coercion visualization
		coercion: true,

		// if provided as array instead of object, default to inclusion not exclusion
		// string representation of operator
		filter: [],
	},

	// --- LITERALS ---
	// Traces the creation/evaluation of literal values in expressions.
	// Makes the evaluation model fully explicit: `1 + 2` becomes
	//   create 1, create 2, add 1 2 and get 3
	// instead of just: add 1 2 and get 3
	//
	// Implementation note: NaN, Infinity, -Infinity, and undefined are technically
	// global variable reads in JS, not literal syntax. But for JeJ they're just values.
	// The instrumentation should filter these specific global reads and route them
	// to literal creation events instead — don't expose the global-read complexity
	// to learners.
	literals: {
		strings: true,
		numbers: true, // includes NaN, Infinity, -Infinity (filtered from global reads)
		booleans: true,
		null: true,
		undefined: true, // filtered from global read — presented as a literal value to learners
	},

	templates: true, // template literals with ${...} interpolation

	// look into syntax of aranlang so I can understand the environment simplifications
	// will need to study the docs & grammar generation - there are examples in his thesis (2 - aranlang, 3 - instrumentation, corner cases & related design decisions)
	scopes: {
		kind: {
			block: true,
			module: true,
		},
		events: {
			create: true,
			enter: true,
			interrupt: true, // return, break (lexically visible). throw, error (cannot be statically found for certain). (not yield, not await)
			completion: true, // normal completion
			leave: true, // the "finally" of a block.  always triggered, whether interrupt or completion
		},
	},

	controlFlow: {
		kind: {
			conditionals: true, // if/else test expressions
			while: true, // traces the test
			forOf: true,
		},
		events: {
			// other events in here?
			test: true,
			branch: true,
			iteration: true,
			jump: true, // break/continue statements
		},

		// if provided as array instead of object, default to inclusion not exclusion
		filter: [],
		// coding: same as config keys
	},

	// --- FUNCTIONS ---
	// JeJ has no user-defined functions. All function calls are to globals:
	//   Interactions: prompt(), alert(), confirm()
	//   Type conversions: Number(), String(), Boolean()
	//   Utilities: Number.isNaN()
	//   Logging: console.log(), console.assert()
	//   String methods: .slice(), .includes(), .toLowerCase(), etc.
	//
	// A string method call like 'abc'.slice(1) composes as:
	//   propertyAccess.dot (access .slice) + functions.call (invoke it)
	functions: {
		call: true,
		arguments: true, // whether to log values passed as arguments (for trace lightness)
		return: true,
		// if provided as array instead of object, default to inclusion not exclusion
		filter: [],
	},
};

export default defaultConfig;
