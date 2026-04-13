/**
 * @file CJS/ESM interop for ajv/dist/2020.
 *
 * JEJ's `options.schema.json` declares `$schema: draft/2020-12/schema`, so the
 * validator must be the `Ajv2020` class. The default `Ajv` class only knows
 * draft-07.
 *
 * CJS/ESM quirk: esbuild's __toESM wraps CJS module.exports as .default
 * (isNodeMode=1), ignoring the __esModule convention. In Node (tsc): the
 * default import IS the Ajv2020 constructor. In esbuild bundles: the default
 * import is the whole exports object, and .default on that is the constructor.
 */

import AjvDefault from 'ajv/dist/2020.js';

const Ajv =
	typeof AjvDefault === 'function'
		? AjvDefault
		: ((AjvDefault as Record<string, unknown>)['default'] as typeof AjvDefault);

export default Ajv;
