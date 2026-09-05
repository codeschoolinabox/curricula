import record from '/Users/master/Documents/0-teach-code/0-spiralearn/0-study-lenses-committee/sl-trace-js-klve/dist/record/index.js';
const CFG = { meta: { max: { steps: 600, iterations: null, callstack: null, time: 3000 }, range: null, timestamps: false, debug: { ast: false } }, options: { filter: {} } };
const safe = (v) => { try { if (typeof v === 'function') return '[fn]'; return JSON.stringify(v) ?? String(v); } catch { return '[unstringifiable]'; } };

// V1 — console.warn: klve-056's rationale says "measured" — supply the measurement
try { await record('console.warn("x");', CFG); console.log('V1 console.warn: OK?!'); }
catch (e) { console.log(`V1 console.warn: ${e?.constructor?.name}: ${e?.message}`); }

// V2 — async arrow returns 1 (round-1 P8 re-confirmation on today's dist)
{
  const s = await record('const f = async () => 1; const v = f(); v;', CFG);
  const v = s.filter((x) => x.type === 'Identifier' && x.time === 'after').at(-1)?.value;
  console.log('V2 async arrow call result: typeof', typeof v, '=', safe(v), '| then-able:', v != null && typeof v.then === 'function', '(native: a Promise)');
}

// V3 — async arrow WITH await in body: the sync replacement makes await illegal
try { await record('const f = async () => await Promise.resolve(1); f();', CFG); console.log('V3 async arrow with await: OK?!'); }
catch (e) { console.log(`V3 async arrow with await: ${e?.constructor?.name}: ${e?.message} | loc=${safe(e?.loc)}`); }

// V4 — CONTROL: async FunctionExpression (wrapped, not replaced) keeps async
{
  const s = await record('const f = async function () { return 2; }; const v = f(); v;', CFG);
  const v = s.filter((x) => x.type === 'Identifier' && x.time === 'after').at(-1)?.value;
  console.log('V4 async FunctionExpression call result: typeof', typeof v, '| then-able:', v != null && typeof v.then === 'function', '(promise fake expected)');
}
