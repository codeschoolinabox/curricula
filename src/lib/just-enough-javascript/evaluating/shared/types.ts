/**
 * @file Types for the shared evaluation infrastructure.
 *
 * Defines the feature configuration system (AllowConfig) and the
 * discriminated union of events produced by the run action (RunEvent).
 */

// --- JSON Schema (subset of Draft-07) ---

/**
 * Subset of JSON Schema used for AllowConfig expansion and default-filling.
 *
 * Copied from `@study-lenses/tracing`'s configuring module — kept minimal
 * to avoid adding Ajv as a dependency.
 */
type JSONSchema = {
	readonly type?: string | readonly string[];
	readonly properties?: Readonly<Record<string, JSONSchema>>;
	readonly additionalProperties?: boolean | JSONSchema;
	readonly description?: string;
};

// --- Feature configuration ---

/**
 * Nested config object controlling which JeJ features are enabled.
 *
 * Structure mirrors the reference.md sections. Each property accepts
 * either a boolean (shorthand for all sub-features) or an object with
 * individual feature toggles.
 *
 * @remarks Used identically by both `allow` (omitted = disabled) and
 * `block` (omitted = enabled) modes. The difference is in how omitted
 * keys are filled, not in the shape.
 */
type AllowConfig = {
	readonly variables?: boolean | VariablesConfig;
	readonly console?: boolean | ConsoleConfig;
	readonly interactions?: boolean | InteractionsConfig;
	readonly conditionals?: boolean;
	readonly loops?: boolean | LoopsConfig;
	readonly jumps?: boolean | JumpsConfig;
	readonly operators?: boolean | OperatorsConfig;
	readonly strings?: boolean | StringsConfig;
	readonly templates?: boolean;
	readonly coercion?: boolean | CoercionConfig;
};

type VariablesConfig = {
	readonly let?: boolean;
	readonly const?: boolean;
};

type ConsoleConfig = {
	readonly log?: boolean;
	readonly assert?: boolean;
};

type InteractionsConfig = {
	readonly alert?: boolean;
	readonly confirm?: boolean;
	readonly prompt?: boolean;
};

type LoopsConfig = {
	readonly while?: boolean;
	readonly forOf?: boolean;
};

type JumpsConfig = {
	readonly break?: boolean;
	readonly continue?: boolean;
};

type OperatorsConfig = {
	readonly typeof?: boolean;
	readonly not?: boolean;
	readonly negation?: boolean;
	readonly and?: boolean;
	readonly or?: boolean;
	readonly equality?: boolean;
	readonly comparison?: boolean;
	readonly plus?: boolean;
	readonly arithmetic?: boolean;
	readonly ternary?: boolean;
};

type StringsConfig = {
	readonly indexAccess?: boolean;
	readonly length?: boolean;
	readonly methods?: boolean | StringMethodsConfig;
};

type StringMethodsConfig = {
	readonly toLowerCase?: boolean;
	readonly toUpperCase?: boolean;
	readonly includes?: boolean;
	readonly replaceAll?: boolean;
	readonly trim?: boolean;
	readonly indexOf?: boolean;
	readonly slice?: boolean;
};

type CoercionConfig = {
	readonly number?: boolean;
	readonly string?: boolean;
	readonly boolean?: boolean;
	readonly numberIsNaN?: boolean;
};

// --- Run events ---

/**
 * Discriminated union of events produced by the `run` action.
 *
 * Errors are events in the array, not thrown exceptions. The consumer
 * always receives a `RunEvent[]` back.
 */
type RunEvent =
	| LogEvent
	| AssertEvent
	| PromptEvent
	| AlertEvent
	| ConfirmEvent
	| ErrorEvent;

type LogEvent = {
	readonly event: 'log';
	readonly args: readonly unknown[];
	readonly line: number;
};

type AssertEvent = {
	readonly event: 'assert';
	readonly args: readonly unknown[];
	readonly line: number;
};

type PromptEvent = {
	readonly event: 'prompt';
	readonly args: readonly unknown[];
	readonly return: string | null;
	readonly line: number;
};

type AlertEvent = {
	readonly event: 'alert';
	readonly args: readonly unknown[];
	readonly return: undefined;
	readonly line: number;
};

type ConfirmEvent = {
	readonly event: 'confirm';
	readonly args: readonly unknown[];
	readonly return: boolean;
	readonly line: number;
};

type ErrorEvent = {
	readonly event: 'error';
	readonly name: string;
	readonly message: string;
	readonly line?: number;
	readonly phase: 'creation' | 'execution';
};

// --- Action configs ---

/**
 * Config for the `run` action.
 *
 * @remarks Provide `allow` OR `block`, never both. Neither = full JeJ.
 */
type RunConfig = {
	readonly maxTime?: number;
	readonly allow?: AllowConfig;
	readonly block?: AllowConfig;
};

/**
 * Config for the `trace` action.
 *
 * @remarks `options` is passed through to the underlying tracer's
 * filter options (AranFilterOptions).
 */
type TraceConfig = {
	readonly maxTime?: number;
	readonly allow?: AllowConfig;
	readonly block?: AllowConfig;
	readonly options?: Record<string, unknown>;
};

/**
 * Config for the `debug` action.
 */
type DebugConfig = {
	readonly maxIterations?: number;
	readonly allow?: AllowConfig;
	readonly block?: AllowConfig;
};

// --- Errors ---

/**
 * Thrown when action config is invalid: both `allow` and `block` provided,
 * or unknown keys in the AllowConfig.
 */
class ConfigError extends Error {
	override readonly name = 'ConfigError' as const;

	constructor(message: string) {
		super(message);
	}
}

export { ConfigError };

export type {
	JSONSchema,
	AllowConfig,
	VariablesConfig,
	ConsoleConfig,
	InteractionsConfig,
	LoopsConfig,
	JumpsConfig,
	OperatorsConfig,
	StringsConfig,
	StringMethodsConfig,
	CoercionConfig,
	RunEvent,
	LogEvent,
	AssertEvent,
	PromptEvent,
	AlertEvent,
	ConfirmEvent,
	ErrorEvent,
	RunConfig,
	TraceConfig,
	DebugConfig,
};
