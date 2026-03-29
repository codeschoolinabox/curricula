> mostly hallucination in here

# Pointcuts: From Educational Config to Aran Join Points

A comprehensive guide to understanding Aran's pointcut system and mapping our
educational configuration to low-level instrumentation points.

## Understanding Aran's Join Point System

Aran provides **two weaving APIs** with different sets of join points where we
can intercept JavaScript execution. For educational tracing, we use the
**Flexible Weaving API** which offers additional granular join points crucial
for teaching programming concepts.

### The Flexible Weaving API

We've chosen the **Flexible API** because its additional granular join points
provide significant pedagogical value for understanding execution order,
debugging mental models, and progressive learning:

```typescript
// Flexible API Join Points - Enhanced for Educational Value
export type FlexibleAspectJoinPoints = {
	// === CORE LANGUAGE FEATURES (Standard + Flexible) ===

	// === BLOCK OPERATIONS ===
	'block@before': {
		/* ... */
	}; // 🎓 PEDAGOGICAL: Entering scope (before setup)
	'block@setup': {
		/* ... */
	}; // Scope initialization
	'block@declaration': {
		/* ... */
	}; // Variable declarations
	'block@teardown': {
		/* ... */
	}; // Leaving any scope
	'block@throwing': {
		/* ... */
	}; // Exception propagation

	// === STATEMENT-LEVEL TRACING ===
	'statement@before': {
		/* ... */
	}; // 🎓 PEDAGOGICAL: Before each statement executes
	'statement@after': {
		/* ... */
	}; // 🎓 PEDAGOGICAL: After each statement completes

	// === EXPRESSION-LEVEL TRACING ===
	'expression@before': {
		/* ... */
	}; // 🎓 PEDAGOGICAL: Before expression evaluation
	'expression@after': {
		/* ... */
	}; // 🎓 PEDAGOGICAL: After expression evaluation

	// === EFFECT OPERATIONS ===
	'effect@before': {
		/* ... */
	}; // 🎓 PEDAGOGICAL: Before side effects occur
	'effect@after': {
		/* ... */
	}; // 🎓 PEDAGOGICAL: After side effects complete

	// === VARIABLE OPERATIONS ===
	'read@after': {
		/* ... */
	}; // Reading variables: x, this.prop
	'write@before': {
		/* ... */
	}; // Writing variables: x = 5, this.prop = 5

	// === FUNCTION OPERATIONS ===
	'apply@around': {
		/* ... */
	}; // Function calls: fn(), obj.method()
	'construct@around': {
		/* ... */
	}; // Constructor calls: new Class()
	'closure@after': {
		/* ... */
	}; // Function creation: function() {}, () => {}

	// === CONTROL FLOW ===
	'test@before': {
		/* ... */
	}; // Conditional tests: if(x), while(x), x ? y : z
	'break@before': {
		/* ... */
	}; // Break/continue statements

	// === VALUE CREATION ===
	'primitive@after': {
		/* ... */
	}; // Literals: 42, "hello", true
	'intrinsic@after': {
		/* ... */
	}; // Built-ins: Array, Object, console

	// === ASYNC OPERATIONS ===
	'await@before': {
		/* ... */
	}; // await expressions
	'await@after': {
		/* ... */
	}; // await resolution
	'yield@before': {
		/* ... */
	}; // yield expressions
	'yield@after': {
		/* ... */
	}; // yield resumption

	// === MODULE OPERATIONS ===
	'import@after': {
		/* ... */
	}; // import statements
	'export@before': {
		/* ... */
	}; // export statements

	// ... and more specialized join points
};
```

### Why These Granular Join Points Matter for Education

The Flexible API's additional join points enable teaching concepts impossible
with coarser-grained tracing:

**🎓 Expression-Level Understanding (`expression@before/after`)**

- Students see exactly when complex expressions like `a + b * c` evaluate
- Helps teach operator precedence and evaluation order
- Critical for debugging skills: "Why did this expression give the wrong
  result?"

**🎓 Statement vs Expression Distinction (`statement@before/after`)**

- Shows the difference between statements (do things) and expressions (produce
  values)
- Helps students understand control flow vs data flow
- Essential for understanding side effects and pure functions

**🎓 Effect Tracking (`effect@before/after`)**

- Clearly separates side effects from value computation
- Teaches functional programming concepts
- Helps identify when and why state changes occur

**🎓 Scope Entry Precision (`block@before` vs `block@setup`)**

- Shows the exact moment when entering a new scope
- Helps understand variable hoisting and temporal dead zones
- Critical for debugging scope-related issues

### Pointcut Configuration

Aran accepts **pointcut configuration** in several formats:

```typescript
// 1. Boolean - enable/disable all join points
const pointcut: boolean = true;

// 2. Array - list of join point names to enable
const pointcut: string[] = ['read@after', 'write@before', 'apply@around'];

// 3. Object - granular control with boolean flags
const pointcut = {
	'read@after': true,
	'write@before': true,
	'apply@around': false,
	// ... other join points default to false
};

// 4. Function - dynamic pointcut based on context
const pointcut = (kind: AspectKind, tag: string) => {
	return kind.startsWith('block@'); // Only block operations
};
```

## Mapping Educational Config � Aran Join Points

Now let's understand how our educational configuration maps to these low-level
join points:

### Variables Configuration

```typescript
// Our educational config:
variables: {
  declare: true,    // Variable declarations
  assign: true,     // Variable assignments
  read: true,       // Variable reads
  filter: ["x", "y"] // Only trace specific variables
}

// Maps to these Aran join points:
{
  "block@declaration": true,  // declare: let x = 5, const y = 10
  "write@before": true,       // assign: x = 10, x += 5
  "read@after": true,         // read: console.log(x), return x
}
```

### Functions Configuration

```typescript
// Our educational config:
functions: {
  calls: true,        // Function invocations
  declarations: true, // Function definitions
  returns: true,      // Return values
  this: false,        // 'this' binding (advanced)
  yield: true,        // Generator yield
  filter: ["myFunc"]  // Only trace specific functions
}

// Maps to these Aran join points:
{
  "apply@around": true,       // calls: fn(), obj.method()
  "construct@around": true,   // calls: new Class()
  "closure@after": true,      // declarations: function() {}, () => {}
  // returns: handled by apply@around advice return value
  "yield@before": true,       // yield: yield expressions
  "yield@after": true,        // yield: yield resumption
}
```

### Control Flow Configuration

```typescript
// Our educational config:
controlFlow: {
  conditionals: true,  // if/else tests
  loops: true,         // while/for conditions
  switches: true,      // switch case tests
  breaks: true,        // break/continue statements
  filter: []           // Control structures to trace
}

// Maps to these Aran join points:
{
  "test@before": true,   // conditionals, loops, switches: if(x), while(x), x ? y : z
  "break@before": true,  // breaks: break label, continue label
}
```

### Operators Configuration

```typescript
// Our educational config:
operators: {
  valueProducing: true,  // +, -, *, /, literals, typeof
  controlFlow: true,     // &&, ||, ?:, comparison tests
  filter: []             // Operators to trace
}

// Maps to these Aran join points:
{
  "primitive@after": true,  // valueProducing: literals (42, "hello", true)
  "intrinsic@after": true,  // valueProducing: built-ins (Array, Object)
  "test@before": true,      // controlFlow: &&, ||, ?: (when used for branching)
}
```

### Blocks Configuration

```typescript
// Our educational config:
blocks: {
  enter: true,             // Entering scope
  exit: true,              // Leaving scope
  declarations: true,      // Variable declarations in scope
  allScopeVariables: false // Show all variables (can be noisy)
}

// Maps to these Aran join points:
{
  "block@setup": true,        // enter: entering functions, loops, etc.
  "block@teardown": true,     // exit: leaving scope
  "block@declaration": true,  // declarations: initial variable bindings
}
```

### Async Configuration

```typescript
// Our educational config:
async: {
  await: true  // await expressions and resolution
}

// Maps to these Aran join points:
{
  "await@before": true,  // await: before promise awaiting
  "await@after": true,   // await: after promise resolution
}
```

### Debugging & Execution Tracing Configuration

```typescript
// Our educational config (NEW with Flexible API):
debugging: {
  statements: true,     // Show statement-level execution order
  expressions: true,    // Show fine-grained expression evaluation
  effects: true,        // Track side effects separately from values
  scopeEntry: true,     // Show precise scope entry timing
  filter: []            // Specific code patterns to trace
}

// Maps to these Flexible API join points:
{
  "statement@before": true,   // statements: before each statement executes
  "statement@after": true,    // statements: after each statement completes
  "expression@before": true,  // expressions: before expression evaluation
  "expression@after": true,   // expressions: after expression evaluation
  "effect@before": true,      // effects: before side effects occur
  "effect@after": true,       // effects: after side effects complete
  "block@before": true,       // scopeEntry: entering scope (before setup)
}
```

### Progressive Learning Configurations

The granular join points enable **progressive complexity** for different skill
levels:

```typescript
// BEGINNER: Just the basics
const beginnerConfig = {
	variables: { read: true, assign: true },
	functions: { calls: true },
	debugging: { statements: false, expressions: false, effects: false },
};

// INTERMEDIATE: Add control flow understanding
const intermediateConfig = {
	...beginnerConfig,
	controlFlow: { conditionals: true, loops: true },
	debugging: { statements: true, expressions: false, effects: false },
};

// ADVANCED: Full debugging detail
const advancedConfig = {
	...intermediateConfig,
	operators: { valueProducing: true },
	debugging: { statements: true, expressions: true, effects: true },
};
```

### Timestamps Configuration

```typescript
// Our educational config:
timestamps: true; // Add milliseconds from program start

// This affects ALL enabled join points by:
// - Recording performance.now() - startTime in each advice function
// - Adding timestamp to every trace event created
```

## The Mapping Algorithm

Your intuition about the mapping algorithm is **exactly correct**! Here's how we
can implement it:

### Phase 1: Config � Join Points Map

```typescript
// Define the mapping from config to join points (Updated for Flexible API)
const CONFIG_TO_JOINPOINTS = {
	// Variables
	'variables.declare': ['block@declaration'],
	'variables.assign': ['write@before'],
	'variables.read': ['read@after'],

	// Functions
	'functions.calls': ['apply@around', 'construct@around'],
	'functions.declarations': ['closure@after'],
	'functions.yield': ['yield@before', 'yield@after'],

	// Control Flow
	'controlFlow.conditionals': ['test@before'],
	'controlFlow.loops': ['test@before'],
	'controlFlow.switches': ['test@before'],
	'controlFlow.breaks': ['break@before'],

	// Operators
	'operators.valueProducing': ['primitive@after', 'intrinsic@after'],
	'operators.controlFlow': ['test@before'],

	// Blocks
	'blocks.enter': ['block@setup'],
	'blocks.exit': ['block@teardown'],
	'blocks.declarations': ['block@declaration'],

	// Async
	'async.await': ['await@before', 'await@after'],

	// Modules
	'modules.imports': ['import@after'],
	'modules.exports': ['export@before'],

	// Iterators (maps to function calls in practice)
	'iterators.forOf': ['apply@around'], // for...of uses iterator protocol
	'iterators.spread': ['apply@around'], // spread uses iterator protocol
	'iterators.destructuring': ['read@after', 'write@before'],

	// Errors
	'errors.throw': ['block@throwing'],
	'errors.catch': ['block@setup'], // try/catch creates new block
	'errors.finally': ['block@teardown'], // finally runs at block teardown

	// Debugging (NEW with Flexible API)
	'debugging.statements': ['statement@before', 'statement@after'],
	'debugging.expressions': ['expression@before', 'expression@after'],
	'debugging.effects': ['effect@before', 'effect@after'],
	'debugging.scopeEntry': ['block@before'],
} as const;
```

### Phase 2: Flatten and Deduplicate

```typescript
function configToJoinPoints(config: ExpandedConfig): string[] {
	const joinPoints: string[] = [];

	// Iterate through config and collect join points
	Object.entries(CONFIG_TO_JOINPOINTS).forEach(([configPath, points]) => {
		const [section, field] = configPath.split('.');
		const sectionConfig = config[section];

		if (sectionConfig && sectionConfig[field] === true) {
			joinPoints.push(...points);
		}
	});

	// Deduplicate using Set
	return [...new Set(joinPoints)];
}

// Example usage:
const config = {
	variables: { read: true, write: true, declare: false },
	functions: { calls: true, declarations: false },
	// ...
};

const enabledJoinPoints = configToJoinPoints(config);
// Result: ["read@after", "write@before", "apply@around", "construct@around"]
```

### Phase 3: Create Aran Pointcut

```typescript
function createAranPointcut(
	enabledJoinPoints: string[],
): Record<string, boolean> {
	const pointcut: Record<string, boolean> = {};

	// All 31 join points default to false
	ALL_ARAN_JOINPOINTS.forEach((joinPoint) => {
		pointcut[joinPoint] = false;
	});

	// Enable only the ones we want
	enabledJoinPoints.forEach((joinPoint) => {
		pointcut[joinPoint] = true;
	});

	return pointcut;
}
```

## Learning Exercise: Trace Example

Let's trace through a simple example:

```javascript
// Student code to trace:
function add(a, b) {
	let result = a + b;
	return result;
}

let x = 5;
let y = add(x, 3);
console.log(y);
```

With our enhanced educational config (using Flexible API):

```typescript
{
  variables: { declare: true, assign: true, read: true },
  functions: { calls: true, declarations: true, returns: true },
  operators: { valueProducing: true },
  debugging: { statements: true, expressions: true, effects: false },
  timestamps: true
}
```

The execution would trigger these join points with **enhanced granularity**:

**📍 Program Initialization:**

1. `"statement@before"` - About to execute function declaration
2. `"closure@after"` - `function add(a, b) { ... }` declaration created
3. `"statement@after"` - Function declaration completed

**📍 Variable Declaration: `let x = 5;`** 4. `"statement@before"` - About to
execute variable declaration 5. `"expression@before"` - About to evaluate `5` 6.
`"primitive@after"` - literal `5` evaluated 7. `"expression@after"` - Expression
`5` evaluation complete 8. `"block@declaration"` - `let x` binding created 9.
`"write@before"` - About to assign to `x` 10. `"statement@after"` - Variable
declaration completed

**📍 Function Call: `let y = add(x, 3);`** 11. `"statement@before"` - About to
execute assignment 12. `"expression@before"` - About to evaluate `add(x, 3)` 13.
`"expression@before"` - About to evaluate `x` (nested expression) 14.
`"read@after"` - Reading `x` (value: 5) 15. `"expression@after"` - Expression
`x` evaluation complete 16. `"expression@before"` - About to evaluate `3` 17.
`"primitive@after"` - literal `3` evaluated 18. `"expression@after"` -
Expression `3` evaluation complete 19. `"apply@around"` - `add(x, 3)` function
call begins - **Inside function scope:** - `"block@before"` - Entering function
scope - `"block@setup"` - Function scope initialized - `"block@declaration"` -
parameters `a`, `b` bound - `"statement@before"` - About to execute
`let result = a + b;` - `"expression@before"` - About to evaluate `a + b` -
`"expression@before"` - About to evaluate `a` (nested) - `"read@after"` -
Reading `a` (value: 5) - `"expression@after"` - Expression `a` complete -
`"expression@before"` - About to evaluate `b` (nested) - `"read@after"` -
Reading `b` (value: 3) - `"expression@after"` - Expression `b` complete -
`"primitive@after"` - the `+` operation result (8) - `"expression@after"` -
Expression `a + b` complete - `"write@before"` - About to assign to `result` -
`"statement@after"` - Declaration statement complete - `"statement@before"` -
About to execute `return result;` - `"expression@before"` - About to evaluate
`result` - `"read@after"` - Reading `result` (value: 8) - `"expression@after"` -
Expression `result` complete - `"statement@after"` - Return statement complete -
`"block@teardown"` - Leaving function scope 20. `"expression@after"` - Function
call expression complete 21. `"block@declaration"` - `let y` binding created 22.
`"write@before"` - About to assign to `y` 23. `"statement@after"` - Assignment
statement complete

**📍 Console Output: `console.log(y);`** 24. `"statement@before"` - About to
execute console.log 25. `"expression@before"` - About to evaluate
`console.log(y)` 26. `"expression@before"` - About to evaluate `y` (nested) 27.
`"read@after"` - Reading `y` (value: 8) 28. `"expression@after"` - Expression
`y` complete 29. `"intrinsic@after"` - `console.log` method accessed 30.
`"apply@around"` - `console.log(y)` call 31. `"expression@after"` - Function
call expression complete 32. `"statement@after"` - Console statement complete

**🎓 Educational Value:**

- Students see **exactly when** each expression evaluates (nested evaluation
  order)
- **Statement vs expression** distinction is crystal clear
- **Scope entry/exit** timing is precise
- **Operator precedence** becomes visible in the trace
- Each event includes timestamp for **timing analysis**

This level of detail enables teaching concepts like "why does `a + b * c`
evaluate `b * c` first?" by showing the exact `expression@before/after`
sequence.

## Next Steps

To implement this system, we need to:

1. **Define the complete mapping** from educational config to Aran join points
2. **Handle filter arrays** (only trace specific variables/functions)
3. **Implement the algorithm** that converts config � join points � Aran
   pointcut
4. **Test with real examples** to ensure the mapping is correct
5. **Optimize performance** by minimizing enabled join points

This pointcut system is the bridge between our educational "what do you want to
learn about?" configuration and Aran's powerful "where in the execution can we
intercept?" capabilities.

**Your initial intuition was spot-on** - this is exactly how we map high-level
educational concepts to low-level instrumentation points!

## Key Architecture Decisions

### 1. Filter Arrays → Pointcut Level (Runtime Efficiency)

**Decision**: Filter arrays (`variables.filter`, `functions.filter`,
`operators.filter`) will be handled at the **pointcut level**, not in advice
functions.

**Rationale**: Runtime efficiency - Aran won't even call our advice functions
for filtered-out variables/functions, saving significant performance overhead.

**Implementation**: Use Flexible API's multiple focused aspects with
filter-aware pointcuts:

```typescript
// Flexible API: Multiple aspects for different concerns
const variableAspect = {
	pointcut: ['read@after', 'write@before'],
	advice: {
		'read@after': (state, path, ...args) => {
			const identifier = extractIdentifier(path);
			// Filter logic in pointcut would have already excluded unwanted variables
			return logger.createVariableEvent('read', identifier, args, path);
		},
		// ... other variable advice
	},
};

const debuggingAspect = {
	pointcut: [
		'statement@before',
		'statement@after',
		'expression@before',
		'expression@after',
	],
	advice: {
		'statement@before': (state, path, ...args) => {
			if (!config.debugging.statements) return;
			return logger.createDebugEvent('statement.start', path, args);
		},
		// ... other debugging advice
	},
};

// Filter logic applied at aspect registration:
const aspects = [variableAspect, functionAspect, debuggingAspect].filter(
	(aspect) => isAspectEnabled(aspect, config),
);
```

**Challenge**: Extracting meaningful names (function names, operator types) from
Aran's `tag` parameter at pointcut time. This requires understanding Aran's AST
location encoding.

### 2. Timestamps → Logging Abstraction (DRY Principle)

**Decision**: Timestamp logic will be handled by a **logging abstraction** to
avoid repetition across all advice functions.

**Rationale**: The timestamp conditional
`config.timestamps ? performance.now() - startTime : undefined` would be
duplicated in every advice function. A centralized logging abstraction
eliminates this duplication.

**Future Implementation**:

```typescript
// Instead of duplicating in each advice:
const advice = {
	'read@after': (state, identifier, value, tag) => {
		const timestamp = config.timestamps
			? performance.now() - startTime
			: undefined;
		return createVariableEvent(tag, timestamp, 'read', identifier, value, {});
	},
};

// Use logging abstraction:
const advice = {
	'read@after': (state, identifier, value, tag) => {
		return logger.createVariableEvent(tag, 'read', identifier, value, {});
		// Timestamp logic handled inside logger.createVariableEvent()
	},
};
```

**Status**: Tabled for later implementation - building the logging abstraction
is a soon-TODO.

### 3. Configuration Flow → /config produces ExpandedConfig

**Decision**: The `/pointcuts` system receives a **"raw" ExpandedConfig** -
fully resolved, no boolean shorthand, no presets.

**Architecture**:

```
/config → produces → ExpandedConfig (clean, expanded)
    ↓
/pointcuts → consumes → ExpandedConfig
    ↓
/pointcuts → produces → AranPointcutConfig + FilterInfo
```

**Example Input to /pointcuts**:

```typescript
{
  variables: { declare: true, assign: true, read: true, filter: ["x", "result"] },
  functions: { calls: true, declarations: false, returns: true, filter: [] },
  timestamps: true,
  // ... fully expanded, no shorthand, no presets
}
```

This ensures clear separation of concerns between configuration resolution and
pointcut generation.

## Flexible API Architecture: Multiple Focused Aspects

### Decision: Flexible API with Multiple Specialized Aspects

After careful analysis of our educational requirements, we've chosen the
**Flexible Weaving API** with **multiple focused aspects** for different
educational concerns.

**Rationale:**

- **Pedagogical granularity** - `expression@before/after`,
  `statement@before/after` enable fine-grained teaching
- **Progressive learning** - instructors can enable different detail levels for
  different skill levels
- **Debugging education** - students see exactly when expressions evaluate and
  statements execute
- **Clean separation** - each aspect handles one educational concern (variables,
  functions, debugging, etc.)
- **Extensibility** - easy to add new educational concerns without touching
  existing aspects

### The Multiple Focused Aspects Pattern

The key insight: **Multiple small, focused aspects rather than one monolithic
aspect**.

```typescript
// ✅ CORRECT: Multiple Focused Aspects, Clean Separation
const variableAspect = {
	pointcut: ['read@after', 'write@before', 'block@declaration'],
	advice: {
		'read@after': (state, path, identifier, value) => {
			// NO conditionals! Pointcut already filtered
			return logger.createEvent('variable.read', { identifier, value, path });
		},
		'write@before': (state, path, identifier, value) => {
			return logger.createEvent('variable.write', { identifier, value, path });
		},
		'block@declaration': (state, path, identifier, kind) => {
			return logger.createEvent('variable.declare', { identifier, kind, path });
		},
	},
};

const debuggingAspect = {
	pointcut: [
		'statement@before',
		'statement@after',
		'expression@before',
		'expression@after',
	],
	advice: {
		'statement@before': (state, path, node) => {
			return logger.createEvent('debug.statement.start', { node, path });
		},
		'statement@after': (state, path, node, result) => {
			return logger.createEvent('debug.statement.end', { node, result, path });
		},
		'expression@before': (state, path, node) => {
			return logger.createEvent('debug.expression.start', { node, path });
		},
		'expression@after': (state, path, node, result) => {
			return logger.createEvent('debug.expression.end', { node, result, path });
		},
	},
};

const functionAspect = {
	pointcut: ['apply@around', 'construct@around', 'closure@after'],
	advice: {
		'apply@around': (state, path, callee, thisArg, args) => {
			const result = Reflect.apply(callee, thisArg, args);
			logger.createEvent('function.call', { callee, args, result, path });
			return result;
		},
		// ... other function advice
	},
};

// Aspects are conditionally registered based on config
const enabledAspects = [
	config.variables && variableAspect,
	config.debugging && debuggingAspect,
	config.functions && functionAspect,
].filter(Boolean);
```

```typescript
// ❌ WRONG: Monolithic Aspect with Conditionals
const monolithicAspect = {
	pointcut: [...ALL_JOIN_POINTS], // Enable everything - BAD!
	advice: {
		'read@after': (state, path, identifier, value) => {
			// Conditionals in advice - BAD!
			if (!config.variables.read) return value;
			if (
				config.variables.filter.length > 0 &&
				!config.variables.filter.includes(identifier)
			)
				return value;
			return logger.createEvent('variable.read', { identifier, value, path });
		},
		'statement@before': (state, path, node) => {
			// More conditionals - BAD!
			if (!config.debugging.statements) return;
			return logger.createEvent('debug.statement.start', { node, path });
		},
		// ... hundreds of lines of conditional logic
	},
};
```

### Architecture Benefits

With the multiple focused aspects approach, we achieve:

1. **Educational Granularity:**
   - **Expression-level tracing** shows operator precedence and evaluation order
   - **Statement-level tracing** distinguishes between execution and value
     production
   - **Effect tracking** separates side effects from pure computation
   - **Progressive complexity** allows instructors to enable detail levels by
     skill

2. **Clean Modular Design:**
   - Each aspect handles **one educational concern** (variables, functions,
     debugging)
   - **No cross-cutting conditionals** - aspects are enabled/disabled as units
   - **Easy extensibility** - new educational concerns become new aspects
   - **Testable isolation** - each aspect can be tested independently

3. **Performance Optimization:**
   - **Selective registration** - only enabled aspects are active
   - **No runtime conditionals** - filtering happens at registration time
   - **Focused pointcuts** - each aspect only intercepts relevant join points

4. **Pedagogical Flexibility:**
   - **Beginner mode**: Just variables and functions
   - **Intermediate mode**: Add control flow and basic debugging
   - **Advanced mode**: Full expression-level granularity
   - **Custom configurations** for specific learning objectives

### Data Flow Architecture

```
Educational Config (with debugging section)
    ↓
Multiple Aspect Registration (conditional based on config)
    ↓
    ├── Variable Aspect (if config.variables)
    ├── Function Aspect (if config.functions)
    ├── Debugging Aspect (if config.debugging)
    └── Control Flow Aspect (if config.controlFlow)
    ↓
Focused Advice Functions (no conditionals, pure logging)
    ↓
Generic Pedagogical Logger (timestamps, formatting)
    ↓
Granular Educational Trace Events
```

This architecture enables **teaching programming concepts that were impossible
with coarser-grained tracing**, while maintaining clean separation of concerns
and optimal performance.

## Implementation Architecture: Flexible API Setup

### Aspect Registration Pipeline

The Flexible API requires more complex setup than the Standard API, but the
pedagogical benefits justify this complexity:

```typescript
// 1. Configuration Processing
function createAspects(config: ExpandedConfig): Aspect[] {
	const aspects: Aspect[] = [];

	// Core language aspects (always available)
	if (config.variables) {
		aspects.push(createVariableAspect(config.variables));
	}

	if (config.functions) {
		aspects.push(createFunctionAspect(config.functions));
	}

	if (config.controlFlow) {
		aspects.push(createControlFlowAspect(config.controlFlow));
	}

	// Flexible API exclusive aspects (pedagogical value)
	if (config.debugging) {
		if (config.debugging.statements) {
			aspects.push(createStatementAspect(config.debugging));
		}

		if (config.debugging.expressions) {
			aspects.push(createExpressionAspect(config.debugging));
		}

		if (config.debugging.effects) {
			aspects.push(createEffectAspect(config.debugging));
		}
	}

	return aspects;
}

// 2. Flexible API Weaving Setup
import { weaveFlexible, createRuntime } from 'aran';

function setupEducationalTracing(code: string, config: ExpandedConfig) {
	// Create runtime with intrinsics
	const runtime = createRuntime({
		console: globalThis.console,
		Reflect: globalThis.Reflect,
		performance: globalThis.performance,
	});

	// Create focused aspects based on config
	const aspects = createAspects(config);

	// Weave with Flexible API
	const instrumentedCode = weaveFlexible(code, aspects, runtime, {
		// Flexible API specific options
		mode: 'normal',
		warning: 'console',
	});

	return instrumentedCode;
}
```

### Progressive Learning Implementation

The granular join points enable sophisticated progressive learning:

```typescript
// Teaching progression configurations
const LEARNING_PROGRESSIONS = {
	// Week 1: Just variables and basic functions
	beginner: {
		variables: { declare: true, assign: true, read: true },
		functions: { calls: true, declarations: true },
		debugging: { statements: false, expressions: false, effects: false },
	},

	// Week 4: Add control flow and statement awareness
	intermediate: {
		...LEARNING_PROGRESSIONS.beginner,
		controlFlow: { conditionals: true, loops: true },
		debugging: { statements: true, expressions: false, effects: false },
	},

	// Week 8: Full debugging detail for complex problems
	advanced: {
		...LEARNING_PROGRESSIONS.intermediate,
		operators: { valueProducing: true, controlFlow: true },
		debugging: { statements: true, expressions: true, effects: true },
	},

	// Debugging specific issues
	operatorPrecedence: {
		variables: { read: true },
		operators: { valueProducing: true },
		debugging: { expressions: true, statements: false, effects: false },
	},

	sideEffectAnalysis: {
		variables: { assign: true, read: true },
		functions: { calls: true },
		debugging: { effects: true, statements: true, expressions: false },
	},
};

// Usage in educational contexts
function createLessonTrace(
	code: string,
	lesson: keyof typeof LEARNING_PROGRESSIONS,
) {
	const config = expandConfig(LEARNING_PROGRESSIONS[lesson]);
	return setupEducationalTracing(code, config);
}
```

### Handling Setup Complexity

The Flexible API's complexity is managed through abstraction layers:

```typescript
// High-level educational API (hides Flexible API complexity)
class EducationalTracer {
	constructor(private baseConfig: UserConfig) {}

	// Simple interface for instructors
	traceForBeginners(code: string) {
		return this.trace(code, 'beginner');
	}

	traceWithDebugging(code: string) {
		return this.trace(code, 'advanced');
	}

	traceOperatorPrecedence(code: string) {
		return this.trace(code, 'operatorPrecedence');
	}

	// Internal complexity hidden here
	private trace(code: string, level: string) {
		const config = this.mergeConfigs(
			this.baseConfig,
			LEARNING_PROGRESSIONS[level],
		);
		const expandedConfig = expandConfig(config);
		return setupEducationalTracing(code, expandedConfig);
	}
}

// Usage: Instructors never see Flexible API complexity
const tracer = new EducationalTracer({ timestamps: true });
const beginnerTrace = tracer.traceForBeginners(studentCode);
const debugTrace = tracer.traceWithDebugging(studentCode);
```

### Performance Considerations

The granular join points do create more events, but smart filtering keeps
overhead manageable:

```typescript
// Performance optimization through selective aspect registration
function optimizeAspects(
	aspects: Aspect[],
	codeAnalysis: CodeAnalysis,
): Aspect[] {
	return aspects.filter((aspect) => {
		// Don't register expression aspect if code has no complex expressions
		if (aspect.name === 'expression' && !codeAnalysis.hasComplexExpressions) {
			return false;
		}

		// Don't register effect aspect if code is purely functional
		if (aspect.name === 'effect' && !codeAnalysis.hasSideEffects) {
			return false;
		}

		return true;
	});
}

// Static analysis reduces runtime overhead
const codeAnalysis = analyzeStudentCode(code);
const optimizedAspects = optimizeAspects(createAspects(config), codeAnalysis);
```

This implementation architecture shows how the Flexible API's complexity is
managed while preserving its pedagogical advantages. The granular join points
enable teaching concepts impossible with coarser instrumentation, making the
additional setup complexity worthwhile for educational applications.
