/**
 * @file Advice stub for effect@after — after side-effects complete.
 *
 * @remarks
 * When implementing: may be needed for capturing post-assignment values
 * (the new value after a WriteEffect completes). For now, deferred — the
 * effect@before hook may suffice if WriteEffect's value sub-expression has
 * already been evaluated by the time the effect fires.
 */

function effectAfter(_state: unknown, ..._point: unknown[]): void {
	// TODO: determine if post-effect value capture is needed here
}

export default effectAfter;
