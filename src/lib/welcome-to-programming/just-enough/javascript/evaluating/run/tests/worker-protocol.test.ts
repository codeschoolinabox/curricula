import { describe, expect, it } from 'vitest';

import {
	BUFFER_SIZE,
	createBufferViews,
	readResponse,
	writeAlertResponse,
	writeConfirmResponse,
	writePromptResponse,
} from '../worker-protocol.js';

describe('worker-protocol', () => {
	describe('createBufferViews', () => {
		it('creates Int32Array and Uint8Array views over a SharedArrayBuffer', () => {
			const sab = new SharedArrayBuffer(BUFFER_SIZE);
			const views = createBufferViews(sab);

			expect(views.control).toBeInstanceOf(Int32Array);
			expect(views.payload).toBeInstanceOf(Uint8Array);
		});

		it('Int32Array view covers the first 16 bytes (4 Int32 slots)', () => {
			const sab = new SharedArrayBuffer(BUFFER_SIZE);
			const views = createBufferViews(sab);

			expect(views.control.length).toBe(4);
		});

		it('Uint8Array view starts at byte 16 for string payload', () => {
			const sab = new SharedArrayBuffer(BUFFER_SIZE);
			const views = createBufferViews(sab);

			expect(views.payload.byteOffset).toBe(16);
		});
	});

	describe('writePromptResponse', () => {
		it('writes a string response that readResponse can decode', () => {
			const sab = new SharedArrayBuffer(BUFFER_SIZE);
			const views = createBufferViews(sab);

			writePromptResponse(views, 'hello');
			const result = readResponse(views);

			expect(result).toEqual({ type: 'string', value: 'hello' });
		});

		it('writes a null response for cancelled prompt', () => {
			const sab = new SharedArrayBuffer(BUFFER_SIZE);
			const views = createBufferViews(sab);

			writePromptResponse(views, null);
			const result = readResponse(views);

			expect(result).toEqual({ type: 'string', value: null });
		});

		it('handles empty string', () => {
			const sab = new SharedArrayBuffer(BUFFER_SIZE);
			const views = createBufferViews(sab);

			writePromptResponse(views, '');
			const result = readResponse(views);

			expect(result).toEqual({ type: 'string', value: '' });
		});

		it('handles unicode characters', () => {
			const sab = new SharedArrayBuffer(BUFFER_SIZE);
			const views = createBufferViews(sab);

			writePromptResponse(views, 'héllo 🌍');
			const result = readResponse(views);

			expect(result).toEqual({ type: 'string', value: 'héllo 🌍' });
		});

		it('sets control signal to responded (2)', () => {
			const sab = new SharedArrayBuffer(BUFFER_SIZE);
			const views = createBufferViews(sab);

			writePromptResponse(views, 'test');

			expect(Atomics.load(views.control, 0)).toBe(2);
		});
	});

	describe('writeConfirmResponse', () => {
		it('writes true that readResponse decodes as boolean', () => {
			const sab = new SharedArrayBuffer(BUFFER_SIZE);
			const views = createBufferViews(sab);

			writeConfirmResponse(views, true);
			const result = readResponse(views);

			expect(result).toEqual({ type: 'boolean', value: true });
		});

		it('writes false', () => {
			const sab = new SharedArrayBuffer(BUFFER_SIZE);
			const views = createBufferViews(sab);

			writeConfirmResponse(views, false);
			const result = readResponse(views);

			expect(result).toEqual({ type: 'boolean', value: false });
		});

		it('sets control signal to responded (2)', () => {
			const sab = new SharedArrayBuffer(BUFFER_SIZE);
			const views = createBufferViews(sab);

			writeConfirmResponse(views, true);

			expect(Atomics.load(views.control, 0)).toBe(2);
		});
	});

	describe('writeAlertResponse', () => {
		it('writes void response that readResponse decodes', () => {
			const sab = new SharedArrayBuffer(BUFFER_SIZE);
			const views = createBufferViews(sab);

			writeAlertResponse(views);
			const result = readResponse(views);

			expect(result).toEqual({ type: 'void' });
		});

		it('sets control signal to responded (2)', () => {
			const sab = new SharedArrayBuffer(BUFFER_SIZE);
			const views = createBufferViews(sab);

			writeAlertResponse(views);

			expect(Atomics.load(views.control, 0)).toBe(2);
		});
	});

	describe('BUFFER_SIZE', () => {
		it('is 8192 bytes', () => {
			expect(BUFFER_SIZE).toBe(8192);
		});
	});
});
