import record from '/Users/master/Documents/0-teach-code/0-spiralearn/0-study-lenses-committee/sl-trace-js-klve/dist/record/index.js';
const CFG = { meta: { max: { steps: 600, iterations: null, callstack: null, time: 3000 }, range: null, timestamps: false, debug: { ast: false } }, options: { filter: {} } };
async function p(label, code) {
  try { const s = await record(code, CFG); console.log(`${label}: OK (${s.length} steps)`); }
  catch (e) { console.log(`${label}: THREW ${e?.constructor?.name}: ${e?.message}`); }
}
await p('S1 import syntax (.mjs content)', 'import x from "y"; x;');
await p('S2 export syntax', 'export const a = 1;');
await p('S3 minimal getter, no writes', 'const o = { get g() { return 7; } }; o;');
await p('S4 getter object never referenced after decl', 'const o = { get g() { return 7; } };');
