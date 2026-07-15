/**
 * @file Raw JSON Schema for tracer options.
 *
 * Re-exports `options.schema.json` as a typed module.
 * Internal code imports this wrapper — never the raw JSON directly.
 * Deep-freezing is done in `index.ts` alongside `langs` and other static data.
 */

export { default } from './options.schema.json' with { type: 'json' };
