/**
 * @file Aran internal parameter names.
 *
 * ReadExpression.variable can be any of these. They are Aran's internal
 * bindings, not user variables. Skip them to avoid spurious BindingEvents.
 *
 * Shared between expression-pointcut (skip reads) and block-declaration
 * (skip frame entries).
 */

const ARAN_PARAMETERS: ReadonlySet<string> = new Set([
	'import',
	'import.meta',
	'this',
	'new.target',
	'function.arguments',
	'function.callee',
	'catch.error',
	'super.get',
	'super.set',
	'super.call',
	'private.check',
	'private.get',
	'private.has',
	'private.set',
	'scope.read',
	'scope.writeStrict',
	'scope.writeSloppy',
	'scope.typeof',
	'scope.discard',
]);

export default ARAN_PARAMETERS;
