/**
 * @file Classify a candidate's failed bring-up into a diagnostic {@link AttemptCause}
 * plus a human-readable `detail`, by the error's SHAPE — never `navigator.onLine`
 * (unreliable). The chain's loader records this per attempt; the precedence engine
 * (promote-terminal-cause.ts) reduces the ledger to the public terminal cause.
 *
 * Discrimination is most-specific-first and every rule is DUCK-TYPED: a worker- or
 * cross-realm-thrown `DOMException` fails `instanceof DOMException` on the main
 * thread, so we match on `name` / message shape, not identity. The shapes are
 * spike-unverified across webllm/wllama and browser-variable, so an undiscriminated
 * error degrades gracefully to `'unknown'` (which the precedence engine folds into
 * `all-candidates-exhausted`).
 */

import type { AttemptCause } from './types.js';

/** The classified outcome of one failed bring-up: a diagnostic cause + a seam-crossing detail string. */
type ClassifiedError = {
	readonly cause: AttemptCause;
	readonly detail?: string;
};

/**
 * Classify a bring-up error into a diagnostic cause + detail.
 *
 * @param error - Whatever a runtime adapter's bring-up rejected with (unknown shape).
 * @returns The {@link AttemptCause} and a bounded human-readable `detail` (omitted
 *   when the error carries no message).
 */
export default function classifyLoadError(error: unknown): ClassifiedError {
	const cause = classifyCause(error);
	const detail = errorDetail(error);
	return detail === undefined ? { cause } : { cause, detail };
}

const HTTP_ERROR_FLOOR = 400;
const DETAIL_MAX = 500;

/** Most-specific-first; an undiscriminated error degrades to 'unknown' (the precedence engine folds it into all-candidates-exhausted). */
function classifyCause(error: unknown): AttemptCause {
	if (isQuotaError(error)) return 'storage-quota';
	if (isCacheEvictedError(error)) return 'cache-evicted';
	if (isDeviceLostError(error)) return 'device-lost';
	if (isFetchError(error)) return 'fetch-failed';
	return 'unknown';
}

/** Storage capacity: the Cache API / OPFS reject a weight write with a QuotaExceededError DOMException (the user's real localhost failure). */
function isQuotaError(error: unknown): boolean {
	return (
		errorName(error) === 'QuotaExceededError' ||
		/quota/i.test(errorMessage(error))
	);
}

/** A cache read-miss / eviction. Production path is the NotFoundError NAME (raw OPFS/Cache miss); the message patterns are best-effort (wllama's real string is "deleted from the cache"). */
function isCacheEvictedError(error: unknown): boolean {
	return (
		errorName(error) === 'NotFoundError' ||
		/evicted|deleted from the cache|cache (miss|not found)|model is deleted/i.test(
			errorMessage(error),
		)
	);
}

/** A WebGPU device drop during bring-up. WebLLM throws a DeviceLostError (its real name + message); the regex tolerates the "device WAS lost" word gap. */
function isDeviceLostError(error: unknown): boolean {
	return (
		errorName(error) === 'DeviceLostError' ||
		/device.{0,15}lost|gpu.{0,15}lost/i.test(errorMessage(error))
	);
}

/** Reachable-but-failed network: a fetch TypeError, an HTTP error status, or a network-shaped message (Safari's "Load failed", Chromium's net::ERR_*). */
function isFetchError(error: unknown): boolean {
	return (
		(error instanceof TypeError && /fetch/i.test(error.message)) ||
		hasHttpErrorStatus(error) ||
		/network|failed to fetch|load failed|net::err_/i.test(errorMessage(error))
	);
}

function hasHttpErrorStatus(error: unknown): boolean {
	return (
		isRecord(error) &&
		typeof error.status === 'number' &&
		error.status >= HTTP_ERROR_FLOOR
	);
}

/** The error's `name`, duck-typed (a worker/cross-realm DOMException fails `instanceof`). */
function errorName(error: unknown): string {
	return isRecord(error) && typeof error.name === 'string' ? error.name : '';
}

function errorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	return isRecord(error) && typeof error.message === 'string'
		? error.message
		: '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

/** A bounded `name: message` hint for the seam-crossing `detail` (omitted when there's no message). */
function errorDetail(error: unknown): string | undefined {
	if (error instanceof Error) {
		return truncate(
			error.message === '' ? error.name : `${error.name}: ${error.message}`,
		);
	}
	const message = errorMessage(error);
	return message === '' ? undefined : truncate(message);
}

function truncate(text: string): string {
	return text.length > DETAIL_MAX ? `${text.slice(0, DETAIL_MAX)}…` : text;
}
