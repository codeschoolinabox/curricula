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

import { Config } from './types.js';

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
const defaultConfig: Config = {
	// === PRESETS SYSTEM & CONFIG CONFIGS ===
	// presets hide full trace & meta configurations, hard-coded in the /presets directory
	// any additional manual configs will override the preset configs
	// Note: presets key omitted here (no default preset) - user explicitly chooses
	// ? array of presets, which will be merged in the precedence they are listed
	//    or better as an object with preset fields? avoids sneaky trace changes based on sequence
	/* other possible preset options
    behavior, strategy, implementation
    granularity levels
    variables, functions, controlFlow, expressions

  */

	meta: {
		// when set to a boolean, all fields are set to this value unless explicitly set otherwise in the config. (any other value and default configs remain)
		// useful for manually toggling only a few configs
		default: null,

		// === META-CONFIGS ===
		// would nesting these be more clear?  pro: semantic grouping, con: nesting

		// will result in trace termination and a warning log entry
		maxIterations: null,
		maxCallstack: null, // simpler to implement than `maxRecursion` (eg. mutual recursion)

		index: true, // include numbered indexes for trace entries

		// which selection of code to trace.  should this be flat?
		range: {
			// number -> line, or [num, num] -> [line, char]
			start: 1,
			end: 1000,
		},

		location: 'line', // line | full [line, col] | false

		// if AST is set to true, AST will be returned
		ast: true, // returns AST and stringified path to AST node for each entry

		// false -> no data, true -> full data, "raw" -> directly log the value
		data: {
			type: true,
			instance: true,
			value: true,
			lookup: false,
		},

		references: true, // similar options as above but for logging which specific reference type was accessed, details TBD

		debug: {
			// adds a stringified path to the config option that was responsible for the trace log.  helpful for debugging, can be
			//  is not used programatically, so is not a tight coupling issue
			configPath: true,
			// what other helpful debug info could be added to a trace that is not learner-meaningful?
			AranNodeId: true,
			adviceName: true,
		},

		timestamps: false, // only helpful when tracing async code
	},

	// === LANGUAGE FEATURES ===

	lang: {
		// Laurent: better term for this?
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
					var: true,
					let: true,
					const: true,
					function: true,
					class: true, // include a field for `extend`
					import: true,
				},

				// must be named before use, but does not have keyword
				explicit: {
					parameters: true, // function(param) {} - revealed in "functions" preset
					catch: true, // catch(e) {} - revealed in "error-handling" preset
				},

				// Bindings created without declaration keywords, and do not need a name before use
				// Hidden in most beginner presets - these are "advanced" concepts
				implicit: {
					global: true, // x = 5 creates global (often a bug!)
					arguments: true, // in non-strict `function`s
					callee: true,
					// event: true, // does Aran support this?
					this: true,
					newTarget: true, // used to construct `this` when in constructor mode
					super: true, // if referenced in an object, it references the prototype of the object.  only super.foo, not super alone.  refresh and study this
					importMeta: true,
					// import: true // ?
				},

				with: true, // would this fall under another? or is it righly its own thing? or is it under "scopes"?
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
			filter: {
				include: [], // if non-empty, trace only these names
				exclude: [],
			},
		},

		// ? should this be under .references ?
		properties: {
			// would this also be triggered by class method definition?

			create: {
				literal: true,
				computed: true,
				method: true,

				accessors: {
					getters: true,
					setters: true,
				},

				class: true, // ?

				// TODO decide if there should be a separate config for class-only proprty things
				static: true, // only classes
				private: true, // only classes
				fields: true, // static class fields with initial value (only classes)
			},
			access: true, // includes accessing (g|s)etters - when accessing a (g|s)etter, the trace will show an access event, then a method call (same as in functions), then an access-returned event

			update: true, // covers reassigning.  mutating a reference-type stored in a property would trace as: property.access, reference.mutate.  so no need for a "mutate" event because that's covered by the reference field

			remove: true, // because "delete" can't be a key in strict mode
			optionalChaining: true, // obj?.prop

			lookup: true, // when the prototype chain is accessed ??? can this be determined and calculated?  This is central enoguh to JS that I want to trace it and ship it with the first version
			// requires some dynamic analysis to know if a propoerty is own or not, but could we do it simply enough by checking an object when it's accessed?  (acknowledging the perfornamce hit of course)
			// how detailed? how to represent? { category: prototype, event: lookup, chain: [this, Array]? }
			// only triggered when propoerty is not found on object _and_ .lookup is set to true

			// with: true // moved to bindings.  I imagine a trace would include accessing a binding in the `with` scope, _then_ accessing the corresponding property in the object (if it exists)

			filter: [],
		},

		// !! representing these in trace will be thorny
		references: {
			create: true,
			access: true,
			mutate: true,
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

			comma: true, // separate because it's distinct, and not common
			// kinna like a binary operator - the one spread, and the one spread into (behind the scenes)
			//  ? Aran desugars spread into Object.assign

			// whether or not to log the intermediate coerced values
			// maybe this isn't the right place, but that's for later. should it be in top-level .meta?
			coercion: true,

			// if provided as array instead of object, default ot inclusion not exclusion
			filter: {
				include: [], // if non-empty, trace only these names
				exclude: [],
			},
		},

		parenthesis: {
			enter: true,
			leave: true,
		},

		templates: {
			literal: true,
			tagged: true, // is a unique reference evaluated in first step of execution (ish) TODO, understand this
		},

		symbols: {
			create: true, // Symbol(), Symbol.for()
			access: true, // obj[symbolKey]
		},

		matching: {
			read: {
				spread: true, // ...spread operations in calls/literals.  right-hand side of assignment
			},
			assign: {
				destructure: true, // [a, b] = array, {x, y} = object.  left-hand side of assignment
				rest: true,
				defaultValues: true,
			},
		},

		// look into syntax of aranlang so I can understand the environment simplifications
		// will need to study the docs & grammar generation - there are examples in his thesis (2 - aranlang, 3 - instrumentation, corner cases & related design decisions)
		scopes: {
			kind: {
				script: true,
				function: true,
				block: true,
				module: true,
				closure: true,
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
					for: {
						// ... decide how detailed to do this
						initialize: true,
						test: true,
						increment: true,
					},
					forOf: true,
					forIn: true,
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
			filter: {
				include: [], // if non-empty, trace only these names
				exclude: [],
			},
			// coding: same as config keys
		},

		errorHandling: {
			throw: true, // Throw statements

			try: true, // Try block entry
			catch: true, // Catch block entry
			finally: true, // Finally block entry

			callstack: true, // Stack trace inclusion
		},

		// new: true, // moved to "construct" under functions

		// aran has 4: function, arrow, method, generator (all can be made async) -> 4 * 2 = 8
		functions: {
			kind: {
				// for all, async can be a filed
				arrow: true, // block/implicit can be a field
				function: true, // named/anonymous can be a field
				method: true,
				generator: true, // named/anonymous can be a field
				builtIn: true,
			},
			events: {
				definition: true, // indicate when a function is defined, and list it's attributes:
				// function invocations: fn(), obj.method()
				call: {
					arguments: true, // decide whether to log values passed as arguments (for trace lightness, similar to with pure.ts)
				},
				construct: true, // the `new` operator.  ?? keep this placement ??  it "feels" more like a function action than a standard operator - even if this isn't technically correct. (design decision/compromise - perfect example of straddling the learner-visible abstraction level with the spec-correct level)
				return: true,
				// does moving these into funciton events make sense?
				coroutines: {
					await: true,
					yield: true,
					yieldDelegate: true, // look this up
				},
			},

			// if provided as array instead of object, default ot inclusion not exclusion
			filter: {
				include: [], // if non-empty, trace only these names
				exclude: [],
			},
		},

		// unsure how feasible these are?

		// do `class`es have enough unique behaviors that they should be configured separately?  (privates, static props, super, extends, static blocks...)  I thnk so?
		// separate question for later: what can actually be determined/traced?
		classes: {
			staticBlock: true,
		},

		modules: {
			// are named and default the only two categories? rexport? ... figure it out later
			imports: {
				named: true,
				default: true,
			}, // import statements and their resolution
			exports: {
				named: true,
				default: true,
			}, // export statements
			load: true, // not sure exactly, but an intuition of bindings assigned value on module load
			await: true, // top-level awaits in a module
		},

		dynamic: {
			eval: true,
			function: true,
		},

		// patterns and flags can be inspected
		regex: true,

		// I would need to implement my own tracking, for security reasons there is no way to access the handlers behind the proxy -> I need to recreate that link
		//  backlog for now, not top priority for early learners
		meta: {
			proxy: true,
			reflect: true,
		},
	},
};

export default defaultConfig;
