/**
 * @file The shared-memory wire protocol: the buffer layout and signal
 * vocabulary both sides of the worker boundary read and write. The
 * thread writes call responses and pause/resume/event-ready flags; the
 * worker (bootstrap) reads responses and blocks on the flags.
 *
 * @remarks Buffer layout (8192 bytes total):
 *
 * | Index/Offset | View       | Purpose                                      |
 * | ------------ | ---------- | -------------------------------------------- |
 * | control[0]   | Int32Array | Call signal: 0=idle, 1=waiting, 2=responded  |
 * | control[1]   | Int32Array | Response type: 0=string, 1=boolean,          |
 * |              |            | 2=null, 3=undefined                          |
 * | control[2]   | Int32Array | Value flag: boolean response value (0/1)     |
 * | control[3]   | Int32Array | Payload byte length                          |
 * | control[4]   | Int32Array | Pause flag: 0=running, 1=paused              |
 * | control[5]   | Int32Array | Event ready: 0=not ready, 1=ready            |
 * | byte 24+     | Uint8Array | UTF-8 encoded string payload (≤ 8168 bytes)  |
 *
 * Layout facts (total size, six-slot Int32 header, payload at byte 24)
 * are ported from the old intercept engine's protocol; the payload
 * ceiling and its bounds check are new — the old engines wrote the
 * payload area unbounded.
 */

const PROTOCOL = Object.freeze({
	/** Total SharedArrayBuffer size in bytes. */
	BUFFER_SIZE: 8192,

	/** Number of Int32 control slots at the head of the buffer. */
	CONTROL_SLOT_COUNT: 6,

	/** Byte offset where the string payload begins (6 Int32 slots × 4 bytes). */
	PAYLOAD_BYTE_OFFSET: 24,

	/**
	 * Maximum encoded payload size in bytes (BUFFER_SIZE minus the
	 * control header). Writes above this fail loudly — never truncate.
	 */
	PAYLOAD_CEILING: 8168,

	/** Int32 slot indices. */
	CONTROL_INDEX: 0,
	RESPONSE_TYPE_INDEX: 1,
	VALUE_FLAG_INDEX: 2,
	PAYLOAD_LENGTH_INDEX: 3,
	PAUSE_INDEX: 4,
	EVENT_READY_INDEX: 5,

	/** Call-signal values (control[0]). */
	SIGNAL_IDLE: 0,
	SIGNAL_WAITING: 1,
	SIGNAL_RESPONDED: 2,

	/** Response-type codes (control[1]) — the CallResponse vocabulary. */
	RESPONSE_STRING: 0,
	RESPONSE_BOOLEAN: 1,
	RESPONSE_NULL: 2,
	RESPONSE_UNDEFINED: 3,

	/** Pause-flag values (control[4]). */
	PAUSE_RUNNING: 0,
	PAUSE_PAUSED: 1,

	/** Event-ready flag values (control[5]). */
	EVENT_NOT_READY: 0,
	EVENT_READY: 1,
} as const);

export default PROTOCOL;
