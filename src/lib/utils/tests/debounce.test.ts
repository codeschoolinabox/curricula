import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import debounce from '../debounce.js';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

describe('debounce — Zero', () => {
	it('does not call the function before the window elapses', () => {
		const spy = vi.fn();
		const debounced = debounce(spy, 100);
		debounced();
		vi.advanceTimersByTime(50);
		expect(spy).not.toHaveBeenCalled();
	});
});

describe('debounce — One (fires after the window)', () => {
	it('calls the function once after the window elapses', () => {
		const spy = vi.fn();
		const debounced = debounce(spy, 100);
		debounced();
		vi.advanceTimersByTime(100);
		expect(spy).toHaveBeenCalledTimes(1);
	});
});

describe('debounce — Many (last call wins)', () => {
	it('calls the function once across rapid calls within the window', () => {
		const spy = vi.fn();
		const debounced = debounce(spy, 100);
		debounced('a');
		debounced('b');
		debounced('c');
		vi.advanceTimersByTime(100);
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('calls the function with the most recent arguments', () => {
		const spy = vi.fn();
		const debounced = debounce(spy, 100);
		debounced('a');
		debounced('b');
		debounced('c');
		vi.advanceTimersByTime(100);
		expect(spy).toHaveBeenCalledWith('c');
	});
});

describe('debounce — Boundaries (cancel and reschedule)', () => {
	it('does not call the function when cancelled mid-window', () => {
		const spy = vi.fn();
		const debounced = debounce(spy, 100);
		debounced();
		vi.advanceTimersByTime(50);
		debounced.cancel();
		vi.advanceTimersByTime(100);
		expect(spy).not.toHaveBeenCalled();
	});

	it('reschedules when called again after a cancel', () => {
		const spy = vi.fn();
		const debounced = debounce(spy, 100);
		debounced('first');
		debounced.cancel();
		debounced('second');
		vi.advanceTimersByTime(100);
		expect(spy).toHaveBeenCalledWith('second');
	});
});

describe('debounce — Simple (cancel is a no-op when idle)', () => {
	it('does not throw when cancelled with nothing pending', () => {
		const debounced = debounce(vi.fn(), 100);
		expect(() => {
			debounced.cancel();
		}).not.toThrow();
	});

	it('does not call the function when only cancelled', () => {
		const spy = vi.fn();
		const debounced = debounce(spy, 100);
		debounced.cancel();
		vi.advanceTimersByTime(200);
		expect(spy).not.toHaveBeenCalled();
	});
});

describe('debounce — Many (independent windows)', () => {
	it('fires once for each separate window', () => {
		const spy = vi.fn();
		const debounced = debounce(spy, 100);
		debounced('first');
		vi.advanceTimersByTime(100);
		debounced('second');
		vi.advanceTimersByTime(100);
		expect(spy).toHaveBeenCalledTimes(2);
	});

	it('uses fresh arguments for the second window', () => {
		const spy = vi.fn();
		const debounced = debounce(spy, 100);
		debounced('first');
		vi.advanceTimersByTime(100);
		debounced('second');
		vi.advanceTimersByTime(100);
		expect(spy).toHaveBeenNthCalledWith(2, 'second');
	});
});
