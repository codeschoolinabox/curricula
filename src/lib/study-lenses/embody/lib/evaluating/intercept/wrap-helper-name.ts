/**
 * @file The name of the per-call wrap helper injected into the worker
 * by intercept's instrumentation phase.
 *
 * The rewriter (`wrap-call-expressions.ts`) emits source containing
 * `__$ic('<nodePath>', () => <originalCall>)` for every CallExpression,
 * and the worker setup injects a function bound to this same name as a
 * `new Function` parameter so user code resolves it correctly. Both
 * sites import this default to stay in sync — never hardcode the string.
 *
 * The name uses `$` (a valid JS identifier character that JeJ-allowed
 * identifiers conventionally avoid since JeJ uses camelCase) to reduce
 * collision risk with user code. A future validation rule can reject
 * any user reference to this exact identifier for friendlier errors.
 */

const HELPER_NAME = '__$ic';

export default HELPER_NAME;
