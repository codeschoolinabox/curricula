/**
 * @file Record module entry point. Wire-up only — do not add logic here.
 *
 * Re-exports the RecordFunction from record.ts.
 *
 * If your engine requires environment detection or conditional loading
 * (e.g. browser vs. Node.js, Pyodide vs. CPython, WASM vs. native),
 * add that wrapper logic here instead of in record.ts.
 *
 * Default: simple re-export. Change only if you need environment switching.
 */

export { default } from './record.js';
