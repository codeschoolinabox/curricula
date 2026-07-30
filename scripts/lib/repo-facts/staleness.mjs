/**
 * Whether a cached measurement is past its usable age. An unparsable
 * timestamp counts as stale — a torn cache never masquerades as fresh.
 *
 * @param {string} cachedIso When the cached value was measured.
 * @param {string} nowIso The current time.
 * @param {number} maxAgeMs Inclusive: exactly max age is still fresh.
 * @returns {boolean}
 */
export default function isStale(cachedIso, nowIso, maxAgeMs) {
	const cached = Date.parse(cachedIso);
	const now = Date.parse(nowIso);
	if (Number.isNaN(cached) || Number.isNaN(now)) return true;
	return now - cached > maxAgeMs;
}
