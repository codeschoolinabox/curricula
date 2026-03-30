/**
 * @file TypeScript type definitions for step entries
 * Central types for all step entry factories in the instrumentation system
 */

// ============================================================================
// Value Representation Types (what representValue returns)
// ============================================================================

/**
 * Data mode for value representation
 * Controls how values are captured in trace steps
 */
export type DataMode = 'full' | 'types' | 'values' | 'raw' | false;

/**
 * Serialized function representation
 */
export type FunctionRepresentation = {
  readonly name: string;
  readonly length: number;
  readonly preview: string;
};

/**
 * Serialized value - the actual data captured for a value
 * Can be primitive, function representation, or deep-cloned object
 */
export type SerializedValue =
  | null
  | undefined
  | boolean
  | number
  | string
  | bigint
  | FunctionRepresentation
  | object; // deep-cloned objects

/**
 * Full value representation - complete type + value + metadata
 * Returned when mode is 'full'
 */
export type FullValueRepresentation = {
  readonly type: string;
  readonly value: SerializedValue;
  readonly lookup: readonly string[];
  readonly instance: string | null;
};

/**
 * Types-only value representation - type metadata without value
 * Returned when mode is 'types'
 */
export type TypesValueRepresentation = {
  readonly type: string;
  readonly lookup: readonly string[];
  readonly instance: string | null;
};

/**
 * Values-only representation - wrapped serialized value
 * Returned when mode is 'values'
 */
export type ValuesValueRepresentation = {
  readonly value: SerializedValue;
};

/**
 * Raw value representation - deep cloned snapshot
 * Returned when mode is 'raw'
 */
export type RawValueRepresentation = unknown;

/**
 * Union of all possible value representations
 * The return type of representValue based on mode
 */
export type ValueRepresentation =
  | FullValueRepresentation
  | TypesValueRepresentation
  | ValuesValueRepresentation
  | RawValueRepresentation
  | undefined; // when mode is false

// ============================================================================
// Step Entry Base Types
// ============================================================================

/**
 * Step entry categories - discriminant for step union types
 */
export type StepCategory =
  | 'operator'
  | 'scope'
  | 'matching'
  | 'parenthesis'
  | 'symbol';

/**
 * Base shape all step entries share
 */
export type BaseStepEntry = {
  readonly category: StepCategory;
};

// ============================================================================
// Operator Step Entry Types
// ============================================================================

/**
 * Pure operator step entry
 * Pure operators produce values without side effects (e.g., +, -, *, ==, <, typeof)
 */
export type PureOperatorEntry = {
  readonly category: 'operator';
  readonly kind: 'pure';
  readonly operator: string;
  readonly operands?: readonly ValueRepresentation[];
  readonly result?: ValueRepresentation;
  readonly coercion?: readonly ValueRepresentation[];
};

/**
 * Mutating operator step entry
 * Operators that modify values (e.g., ++, --, +=, -=)
 */
export type MutatingOperatorEntry = {
  readonly category: 'operator';
  readonly kind: 'mutating';
  readonly operator: string;
  readonly target: string;
  readonly oldValue?: ValueRepresentation;
  readonly newValue?: ValueRepresentation;
  readonly operand?: ValueRepresentation;
};

/**
 * Short-circuiting operator step entry
 * Operators that may skip right operand evaluation (&&, ||, ??)
 */
export type ShortCircuitingOperatorEntry = {
  readonly category: 'operator';
  readonly kind: 'short-circuiting';
  readonly operator: string;
  readonly left?: ValueRepresentation;
  readonly right?: ValueRepresentation;
  readonly result?: ValueRepresentation;
  readonly rightEvaluated: boolean;
};

/**
 * Comma operator step entry
 */
export type CommaOperatorEntry = {
  readonly category: 'operator';
  readonly kind: 'comma';
  readonly operator: ',';
  readonly operands?: readonly ValueRepresentation[];
  readonly result?: ValueRepresentation;
};

/**
 * Union of all operator step entries
 */
export type OperatorEntry =
  | PureOperatorEntry
  | MutatingOperatorEntry
  | ShortCircuitingOperatorEntry
  | CommaOperatorEntry;

// ============================================================================
// Reference Step Entry Types
// ============================================================================

/**
 * Reference create step entry
 * When a new variable/binding is created
 * Note: Uses category 'scope' per existing implementation
 */
export type ReferenceCreateEntry = {
  readonly category: 'scope';
  readonly event: 'create';
  readonly value?: ValueRepresentation;
  readonly id?: number;
};

/**
 * Reference access step entry
 * When a variable is read
 * Note: Uses category 'scope' per existing implementation
 */
export type ReferenceAccessEntry = {
  readonly category: 'scope';
  readonly event: 'access';
  readonly value?: ValueRepresentation;
  readonly id?: number;
};

/**
 * Reference mutate step entry
 * When a variable is reassigned
 * Note: Uses category 'scope' per existing implementation
 */
export type ReferenceMutateEntry = {
  readonly category: 'scope';
  readonly event: 'mutate';
  readonly value?: ValueRepresentation;
  readonly update?: ValueRepresentation;
  readonly id?: number;
};

/**
 * Union of all reference step entries
 */
export type ReferenceEntry =
  | ReferenceCreateEntry
  | ReferenceAccessEntry
  | ReferenceMutateEntry;

// ============================================================================
// Scope Step Entry Types
// ============================================================================

/**
 * Scope events
 */
export type ScopeEvent = 'enter' | 'leave' | 'create' | 'interrupt' | 'completion';

/**
 * Scope kinds
 */
export type ScopeKind = 'block' | 'function' | 'closure' | 'module' | 'script';

/**
 * Bindings record - variable names to their representations
 */
export type BindingsRecord = Readonly<Record<string, ValueRepresentation>>;

/**
 * Base scope entry shape
 */
export type BaseScopeEntry = {
  readonly category: 'scope';
  readonly kind: ScopeKind;
  readonly event?: ScopeEvent;
  readonly bindings?: BindingsRecord;
};

/**
 * Block scope entry (for, if, while, etc.)
 */
export type BlockScopeEntry = BaseScopeEntry & {
  readonly kind: 'block';
  readonly structure?: string;
  readonly label?: string;
};

/**
 * Closure scope entry
 */
export type ClosureScopeEntry = BaseScopeEntry & {
  readonly kind: 'closure';
  readonly parentName?: string;
  readonly parentCall?: number;
};

/**
 * Function scope entry
 */
export type FunctionScopeEntry = BaseScopeEntry & {
  readonly kind: 'function';
  readonly name?: string;
  readonly params?: readonly string[];
};

/**
 * Module scope entry
 */
export type ModuleScopeEntry = BaseScopeEntry & {
  readonly kind: 'module';
  readonly file?: string;
};

/**
 * Script scope entry
 */
export type ScriptScopeEntry = BaseScopeEntry & {
  readonly kind: 'script';
  readonly file?: string;
};

/**
 * Union of all scope step entries
 */
export type ScopeEntry =
  | BlockScopeEntry
  | ClosureScopeEntry
  | FunctionScopeEntry
  | ModuleScopeEntry
  | ScriptScopeEntry;

// ============================================================================
// Matching Step Entry Types (destructuring, spread, rest, defaults)
// ============================================================================

/**
 * Matching syntax types
 * Note: 'defaults' with 's' per actual implementation
 */
export type MatchingSyntax = 'destructure' | 'spread' | 'rest' | 'defaults';

/**
 * Matching step entry
 */
export type MatchingEntry = {
  readonly category: 'matching';
  readonly kind: 'read' | 'assign';
  readonly syntax: MatchingSyntax;
  readonly value?: ValueRepresentation;
};

// ============================================================================
// Symbol Step Entry Types
// ============================================================================

/**
 * Symbol step entry
 * Note: Uses 'kind' per actual implementation, 'description' instead of 'name'
 */
export type SymbolEntry = {
  readonly category: 'symbol';
  readonly kind: 'create' | 'access';
  readonly id: number | null;
  readonly description?: string;
};

// ============================================================================
// Parenthesis Step Entry Types
// ============================================================================

/**
 * Parenthesis step entry
 * Note: Uses 'kind' per actual implementation
 */
export type ParenthesisEntry = {
  readonly category: 'parenthesis';
  readonly kind: 'enter' | 'leave';
  readonly count: number | null;
};

// ============================================================================
// Union of All Step Entries
// ============================================================================

/**
 * Union of all possible step entry types
 */
export type StepEntry =
  | OperatorEntry
  | ReferenceEntry
  | ScopeEntry
  | MatchingEntry
  | SymbolEntry
  | ParenthesisEntry;
