import { describe, expect, it } from 'vitest';

import bucketDeviceMemory from '../bucket-device-memory.js';

describe('bucketDeviceMemory', () => {
	it('zero → zero', () => {
		expect(bucketDeviceMemory(0)).toBe(0);
	});

	it('well above the ceiling → the ceiling', () => {
		expect(bucketDeviceMemory(16)).toBe(8);
	});

	it('the ceiling itself → unchanged (inclusive)', () => {
		expect(bucketDeviceMemory(8)).toBe(8);
	});

	it('a sub-1 bucket → unchanged (not rounded)', () => {
		expect(bucketDeviceMemory(0.5)).toBe(0.5);
	});

	it('a mid bucket → unchanged', () => {
		expect(bucketDeviceMemory(4)).toBe(4);
	});

	it('just above the ceiling → the ceiling', () => {
		expect(bucketDeviceMemory(8.5)).toBe(8);
	});
});
