/**
 * @file Public types for the debug engine.
 *
 * `DebugEvent` describes one logged occurrence during a debug run.
 * `DebugResult` is the value returned by the async generator after
 * iteration completes.
 */

/**
 * A single recorded occurrence during a debug run. Currently the debug
 * engine emits only error events (success yields nothing); the type is
 * shaped as a union so future event kinds can be added without churn.
 */
type DebugEvent = {
	readonly event: 'error';
	readonly name: string;
	readonly message: string;
};

/**
 * The value returned by the debug async generator after iteration
 * completes. Success carries an empty logs array; failures carry the
 * classified error and any emitted DebugEvents.
 */
type DebugResult =
	| {
			readonly ok: true;
			readonly logs: readonly DebugEvent[];
	  }
	| {
			readonly ok: false;
			readonly error:
				| {
						readonly kind: 'iteration-limit';
						readonly name: string;
						readonly message: string;
						readonly phase: 'execution';
						readonly limit: number;
				  }
				| {
						readonly kind: 'javascript';
						readonly name: string;
						readonly message: string;
						readonly phase: 'creation';
				  };
			readonly logs: readonly DebugEvent[];
	  };

export type { DebugEvent, DebugResult };
