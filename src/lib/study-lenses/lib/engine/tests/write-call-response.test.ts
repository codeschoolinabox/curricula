import { describe, expect, it } from 'vitest';

import createBufferViews from '../worker/create-buffer-views.js';
import PROTOCOL from '../worker/protocol.js';
import readCallResponse from '../worker/read-call-response.js';
import writeCallResponse from '../worker/write-call-response.js';

describe('writeCallResponse', () => {
	describe('round-trip with readCallResponse', () => {
		it('round-trips undefined', () => {
			const views = createBufferViews(
				new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
			);

			// eslint-disable-next-line unicorn/no-useless-undefined -- undefined is the response value under test
			writeCallResponse(views, undefined);

			expect(readCallResponse(views)).toBeUndefined();
		});

		it('round-trips a string', () => {
			const views = createBufferViews(
				new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
			);

			writeCallResponse(views, 'hello');

			expect(readCallResponse(views)).toBe('hello');
		});

		it('round-trips true', () => {
			const views = createBufferViews(
				new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
			);

			writeCallResponse(views, true);

			expect(readCallResponse(views)).toBe(true);
		});

		it('round-trips false', () => {
			const views = createBufferViews(
				new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
			);

			writeCallResponse(views, false);

			expect(readCallResponse(views)).toBe(false);
		});

		it('round-trips null', () => {
			const views = createBufferViews(
				new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
			);

			writeCallResponse(views, null);

			expect(readCallResponse(views)).toBeNull();
		});

		it('round-trips the empty string', () => {
			const views = createBufferViews(
				new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
			);

			writeCallResponse(views, '');

			expect(readCallResponse(views)).toBe('');
		});

		it('round-trips multi-byte unicode', () => {
			const views = createBufferViews(
				new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
			);

			writeCallResponse(views, 'héllo 🌍');

			expect(readCallResponse(views)).toBe('héllo 🌍');
		});

		it('round-trips a payload of exactly the ceiling size', () => {
			const views = createBufferViews(
				new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
			);

			writeCallResponse(views, 'x'.repeat(PROTOCOL.PAYLOAD_CEILING));

			expect(readCallResponse(views)).toBe(
				'x'.repeat(PROTOCOL.PAYLOAD_CEILING),
			);
		});
	});

	describe('wire protocol slot state', () => {
		it('sets the control slot to RESPONDED', () => {
			const views = createBufferViews(
				new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
			);

			writeCallResponse(views, 'test');

			expect(Atomics.load(views.control, PROTOCOL.CONTROL_INDEX)).toBe(
				PROTOCOL.SIGNAL_RESPONDED,
			);
		});

		it('writes the undefined type code for undefined', () => {
			const views = createBufferViews(
				new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
			);

			// eslint-disable-next-line unicorn/no-useless-undefined -- undefined is the response value under test
			writeCallResponse(views, undefined);

			expect(Atomics.load(views.control, PROTOCOL.RESPONSE_TYPE_INDEX)).toBe(
				PROTOCOL.RESPONSE_UNDEFINED,
			);
		});

		it('resets the response type to string after a prior boolean write', () => {
			const views = createBufferViews(
				new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
			);
			writeCallResponse(views, true);

			writeCallResponse(views, 'hello');

			expect(Atomics.load(views.control, PROTOCOL.RESPONSE_TYPE_INDEX)).toBe(
				PROTOCOL.RESPONSE_STRING,
			);
		});

		it('records the encoded byte length for a string', () => {
			const views = createBufferViews(
				new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
			);

			writeCallResponse(views, 'hello');

			expect(Atomics.load(views.control, PROTOCOL.PAYLOAD_LENGTH_INDEX)).toBe(
				5,
			);
		});

		it('writes the boolean type code for true', () => {
			const views = createBufferViews(
				new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
			);

			writeCallResponse(views, true);

			expect(Atomics.load(views.control, PROTOCOL.RESPONSE_TYPE_INDEX)).toBe(
				PROTOCOL.RESPONSE_BOOLEAN,
			);
		});

		it('sets the value flag for true', () => {
			const views = createBufferViews(
				new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
			);

			writeCallResponse(views, true);

			expect(Atomics.load(views.control, PROTOCOL.VALUE_FLAG_INDEX)).toBe(1);
		});

		it('clears a previously-set value flag when writing false after true', () => {
			const views = createBufferViews(
				new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
			);
			writeCallResponse(views, true);

			writeCallResponse(views, false);

			expect(Atomics.load(views.control, PROTOCOL.VALUE_FLAG_INDEX)).toBe(0);
		});

		it('writes the null type code for null', () => {
			const views = createBufferViews(
				new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
			);

			writeCallResponse(views, null);

			expect(Atomics.load(views.control, PROTOCOL.RESPONSE_TYPE_INDEX)).toBe(
				PROTOCOL.RESPONSE_NULL,
			);
		});
	});

	describe('payload ceiling', () => {
		it('throws a RangeError one byte over the ceiling', () => {
			const views = createBufferViews(
				new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
			);

			expect(() =>
				writeCallResponse(views, 'x'.repeat(PROTOCOL.PAYLOAD_CEILING + 1)),
			).toThrow(RangeError);
		});

		it('names the ceiling and the actual size in the error', () => {
			const views = createBufferViews(
				new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
			);

			expect(() =>
				writeCallResponse(views, 'x'.repeat(PROTOCOL.PAYLOAD_CEILING + 1)),
			).toThrow('8169 bytes; the ceiling is 8168');
		});

		it('measures the ceiling in encoded bytes, not characters', () => {
			const views = createBufferViews(
				new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
			);

			expect(() => writeCallResponse(views, '€'.repeat(2723))).toThrow(
				RangeError,
			);
		});

		it('leaves the control slot idle after an overflowing write', () => {
			const views = createBufferViews(
				new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
			);

			expect(() =>
				writeCallResponse(views, 'x'.repeat(PROTOCOL.PAYLOAD_CEILING + 1)),
			).toThrow(RangeError);
			expect(Atomics.load(views.control, PROTOCOL.CONTROL_INDEX)).toBe(
				PROTOCOL.SIGNAL_IDLE,
			);
		});

		it('leaves the type slot untouched after an overflowing write', () => {
			const views = createBufferViews(
				new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
			);

			expect(() =>
				writeCallResponse(views, 'x'.repeat(PROTOCOL.PAYLOAD_CEILING + 1)),
			).toThrow(RangeError);
			expect(Atomics.load(views.control, PROTOCOL.RESPONSE_TYPE_INDEX)).toBe(0);
		});

		it('leaves the payload bytes unmodified after an overflowing write', () => {
			const views = createBufferViews(
				new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
			);

			expect(() =>
				writeCallResponse(views, 'x'.repeat(PROTOCOL.PAYLOAD_CEILING + 1)),
			).toThrow(RangeError);
			expect(views.payload.every((byte) => byte === 0)).toBe(true);
		});

		it('preserves a prior valid response when a later write overflows', () => {
			const views = createBufferViews(
				new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
			);
			writeCallResponse(views, 'valid');

			expect(() =>
				writeCallResponse(views, 'x'.repeat(PROTOCOL.PAYLOAD_CEILING + 1)),
			).toThrow(RangeError);

			expect(readCallResponse(views)).toBe('valid');
		});
	});
});
