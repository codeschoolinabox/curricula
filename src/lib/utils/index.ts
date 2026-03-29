/**
 * @file Barrel export for shared utilities.
 *
 * Import via the `@utils` path alias instead of fragile relative paths:
 *
 *   import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';
 *   import { deepFreezeInPlace, deepFreeze } from '@utils';
 */

export { default as deepClone } from './deep-clone.js';
export { default as deepEqual } from './deep-equal.js';
export { default as deepFreeze } from './deep-freeze.js';
export { default as deepFreezeInPlace } from './deep-freeze-in-place.js';
export { default as deepMerge } from './deep-merge.js';
export { default as isPlainObject } from './is-plain-object.js';
