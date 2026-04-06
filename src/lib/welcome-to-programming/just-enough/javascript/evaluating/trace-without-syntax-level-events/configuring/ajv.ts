/**
 * @file CJS/ESM interop for ajv.
 *
 * esbuild's __toESM wraps CJS module.exports as .default (isNodeMode=1),
 * ignoring the __esModule convention. In Node (tsc): the default import
 * IS the Ajv constructor. In esbuild bundles: the default import is the
 * whole exports object, and .default on that is the Ajv constructor.
 */

import AjvDefault from 'ajv';

const Ajv =
  typeof AjvDefault === 'function'
    ? AjvDefault
    : ((AjvDefault as Record<string, unknown>)['default'] as typeof AjvDefault);

export default Ajv;
