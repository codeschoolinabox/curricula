// Numeric, not 'latest' — eslint-scope's ES6 gate is `ecmaVersion >= 6`: a
// string fails the comparison and silently degrades every scope to ES5. One
// shared value keeps acorn's two readers (tokenize, parse) and the environment
// stage's scope analysis on one parse goal, so they cannot drift.
const ECMA_VERSION = 2024;

export default ECMA_VERSION;
