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

/**
 * === PRESET vs GRANULAR RESPONSIBILITY ===
 *
 * This config file defines ALL possible trace events (maximum granularity).
 * Presets (defined elsewhere) create learning progressions by enabling
 * subsets of these options:
 *
 * PROGRESSION EXAMPLE - Understanding Variables:
 *
 * Level 1: "variables-basic"
 *   - Only var/let/const declarations
 *   - Only available/assign/read events
 *   - Mental model: "Variables hold values"
 *
 * Level 2: "variables-hoisting"
 *   - Adds declare event
 *   - Shows var vs let/const differences
 *   - Mental model: "JavaScript reads code twice"
 *
 * Level 3: "variables-tdz"
 *   - Distinguishes declare from available
 *   - Shows temporal dead zone
 *   - Mental model: "let/const have a limbo state"
 *
 * Level 4: "bindings-complete"
 *   - Adds parameters, catch, implicit globals
 *   - Full lifecycle tracking
 *   - Mental model: "Everything that creates a named value"
 *
 * The granular configs below are the "atoms" - presets combine them
 * into "molecules" matching different pedagogical needs.
 */
const defaultConfig = {
	// Laurent: better term for this?
	// doesn't need to be cnfigurd, can always be true
	semantics: true, // label trace entries as 'statement', 'expression', 'value', or ... other?

	/**
	 * === BINDINGS CONFIGURATION ===
	 *
	 * RESPONSIBILITY BOUNDARY:
	 * This granular config provides MAXIMUM detail for all binding types.
	 * Presets will selectively enable/disable these options to create
	 * progressive learning experiences:
	 *
	 * PRESET EXAMPLES:
	 *
	 * "variables" preset (beginner - text-surface intuition):
	 *   - declarative: { var: true, let: true, const: true, function: false, import: false }
	 *   - implicit: { all false }
	 *   - available: true, initialize: true, assign: true
	 *   - declare: false (hoisting is "magic" at this level)
	 *
	 * "scope-aware" preset (intermediate - understands hoisting):
	 *   - declarative: { all true }
	 *   - implicit: { global: true, others false }
	 *   - declare: true (now we explain hoisting)
	 *   - Shows TDZ, scope chain
	 *
	 * "full-bindings" preset (advanced - spec-adjacent):
	 *   - All options enabled
	 *   - Shows parameters, catch bindings, implicit globals
	 *   - Complete lifecycle: declare → available → initialize → assign
	 */
	bindings: {
		kind: {
			declarative: {
				let: true,
				const: true,
			},

			// Bindings created without declaration keywords, and do not need a name before use
			// Hidden in most beginner presets - these are "advanced" concepts
			implicit: {
				global: true, // x = 5 creates global (often a bug!)
			},
		},
		events: {
			/**
			 * --- BINDING LIFECYCLE EVENTS ---
			 *
			 * Different presets reveal different lifecycle granularity:
			 *   Beginner sees:    available → assign
			 *   Intermediate:     declare → available → assign
			 *   Advanced:         declare → available → initialize → assign
			 *
			 * EVENT TIMELINE EXAMPLES:
			 *
			 * var x = 5:
			 *   Scope entry → declare + available + initialize(undefined)
			 *   At line     → assign(5)
			 *
			 * let y = 5:
			 *   Scope entry → declare (enters TDZ)
			 *   At line     → available + initialize(5)
			 *
			 * function foo() {}:
			 *   Scope entry → declare + available + initialize(function)
			 *
			 * parameter:
			 *   Function call → available + initialize(argValue)
			 *
			 * global (x = 5):
			 *   At line → available + initialize(5)
			 */

			// When binding enters scope (hoisting phase for var/function/let/const)
			// Hidden in beginner presets - hoisting is "behind the curtain"
			// for explicit keywords
			declare: true,

			// When binding becomes usable without error
			// Core event for all presets - "when can I use this?"
			// is for implicit
			available: true,

			// When binding gets its first value _before_ 'available' event
			// - var: initialized to undefined at hoist, then "assigned" at declaration line
			// - function: initialized to function at hoist
			// - let/const: initialized at declaration line (same time as available)
			// - parameters: initialized at function call
			// Beginner presets might hide this distinction
			// ?? flagged in trace as "implicit" if no initialization in code?
			initialize: true,
			// indicating that an undefined initialization was implicit, not with an explicit `=` assignment
			implicit: true,

			// Subsequent value changes after initialization
			// Essential for all presets - tracking value mutations
			assign: true,

			// When binding value is accessed
			// Essential for all presets - tracking data flow
			read: true,
		},
		// if provided as array instead of object, default ot inclusion not exclusion
		filter: [],
	},

	// ? should this be under .references ?
	properties: {
		// would this also be triggered by class method definition?

		access: true, // includes accessing (g|s)etters - when accessing a (g|s)etter, the trace will show an access event, then a method call (same as in functions), then an access-returned event

		optionalChaining: true, // obj?.prop

		lookup: true, // when the prototype chain is accessed ??? can this be determined and calculated?  This is central enoguh to JS that I want to trace it and ship it with the first version
		// requires some dynamic analysis to know if a propoerty is own or not, but could we do it simply enough by checking an object when it's accessed?  (acknowledging the perfornamce hit of course)
		// how detailed? how to represent? { category: prototype, event: lookup, chain: [this, Array]? }
		// only triggered when propoerty is not found on object _and_ .lookup is set to true

		filter: [],
	},

	// backlogging if/how to trace built-in data structures
	//  for now can simply trace as:
	//    function call with inputs/outputs as that's how it appears in syntax
	//    and with new operator, as that's also accurate
	// dataStructures: {},

	operators: {
		pure: true, // +, -, *, ==, <, typeof, in, instanceof, void (produce new values without side-effect)
		mutating: true, // =, +=, ++, -- (change variable state)
		shortCircuiting: true, // &&, ||, ??, ?: (choose between values)

		// whether or not to log the intermediate coerced values
		// maybe this isn't the right place, but that's for later. should it be in top-level .meta?
		coercion: true,

		// if provided as array instead of object, default ot inclusion not exclusion
		filter: [],
	},

	parenthesis: {
		enter: true,
		leave: true,
	},

	templates: {
		literal: true,
		tagged: true, // is a unique reference evaluated in first step of execution (ish) TODO, understand this
	},

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
			loops: {
				while: true, // includes do/while for simplicity
				forOf: true,
			}, // while/for/for...of condition tests
			// a proper nightmare, will need to combine semanitcs (eg. varaible indicates if matched) from desugar with static analysis from where I am
			switch: true, // switch case evaluations
		},
		events: {
			// other events in here?
			test: true,
			branch: true,
			iteration: true,
			jump: true, // break/continue statements
		},

		// if provided as array instead of object, default ot inclusion not exclusion
		filter: [],
		// coding: same as config keys
	},

	// aran has 4: function, arrow, method, generator (all can be made async) -> 4 * 2 = 8
	functions: {
		events: {
			call: {
				arguments: true, // decide whether to log values passed as arguments (for trace lightness, similar to with pure.ts)
			},
			return: true,
		},

		// if provided as array instead of object, default ot inclusion not exclusion
		filter: [],
	},
};

export default defaultConfig;
