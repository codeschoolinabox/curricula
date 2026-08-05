/**
 * Single typedef home for the measured-facts oracle's bounded context (see
 * scripts/DOCS.md § Measured-facts oracle). `Measurement` lives here — moved
 * from the checker's context per the campaign's R1 ruling: one typedef home
 * PER bounded context.
 *
 * @typedef {object} Measurement
 * @property {string} label What the number is, in the oracle's own words.
 * @property {string} command The producing command, verbatim.
 * @property {string} value Measured output, already condensed to one line or
 *   a short block.
 * @property {string} timestamp ISO 8601 time the command ran.
 *
 * @typedef {object} TscResult
 * @property {number} count Every diagnostic counts — a location-less global
 *   diagnostic still increments (a false zero is the worst failure).
 * @property {string[]} locations `file(line,col)` prefixes for the
 *   diagnostics that carry one.
 *
 * @typedef {object} CacheRecord
 * @property {string} value The condensed measurement value as cached.
 * @property {string} measuredAt ISO 8601 time the cached value was measured.
 *
 * @typedef {Record<string, CacheRecord>} CacheFile The cache file parsed
 *   whole: one CacheRecord per successful slow measurement, keyed by that
 *   measurement's cache key. A write merges its record over the keys already
 *   present — persisting one measurement preserves the records under the
 *   others.
 */

export {};
