// Counter-ledger probe: measures contested behaviors against the quarry's BUILT dist.
// Read-only import; nothing in the quarry is modified.
import record from '/Users/master/Documents/0-teach-code/0-spiralearn/0-study-lenses-committee/sl-trace-js-klve/dist/record/index.js';

const META = (over = {}) => ({
  max: { steps: 400, iterations: null, callstack: null, time: 3000, ...over },
  range: null,
  timestamps: false,
  debug: { ast: false },
});
const CFG = (metaOver = {}, options = { filter: {} }) => ({ meta: META(metaOver), options });

const show = (s) =>
  `#${s.step} ${s.category}${s.type ? ' ' + s.type : ''}${s.time ? ' ' + s.time : ''}${'value' in s ? ' value=' + JSON.stringify(typeof s.value === 'function' ? '[fn]' : s.value) : ''}`;

async function probe(label, code, cfg = CFG(), filter = null) {
  try {
    const steps = await record(code, cfg);
    const picked = filter ? steps.filter(filter) : steps;
    console.log(`\n=== ${label} === (${steps.length} steps total)`);
    for (const s of picked) console.log('  ' + show(s));
    return steps;
  } catch (e) {
    console.log(`\n=== ${label} === THREW ${e.constructor.name}: ${e.message}`);
    return null;
  }
}

// P1 — output init step number
{
  const steps = await probe('P1 init step number', 'let x = 1;', CFG(), (s) => s.category === 'init');
  if (steps) console.log('  first step JSON:', JSON.stringify({ step: steps[0].step, category: steps[0].category }));
}

// P2 — ReturnStatement: any after step? full step list for a called function
await probe(
  'P2 return steps',
  'function f() { return 7; } f();',
  CFG(),
  (s) => s.type === 'ReturnStatement',
);

// P2b — dead code after return: does it execute? (log attaches if console.log runs)
{
  const steps = await probe('P2b dead code after return', 'function f() { return 7; console.log("DEAD"); } f();', CFG());
  if (steps) {
    const logged = steps.flatMap((s) => (s.logs ?? []).flat());
    console.log('  logged lines:', JSON.stringify(logged));
  }
}

// P3 — While/For statement 'after' steps
await probe(
  'P3 while before/after',
  'let i = 0; while (i < 2) { i++; }',
  CFG(),
  (s) => s.type === 'WhileStatement',
);
await probe(
  'P3b for before/after',
  'for (let i = 0; i < 2; i++) {}',
  CFG(),
  (s) => s.type === 'ForStatement',
);

// P4 — s++ on a string: stored + reported values
{
  const steps = await probe('P4 s++ string coercion', 'let s = "5"; s++; s;', CFG());
  if (steps) {
    const upd = steps.filter((x) => x.type === 'UpdateExpression');
    const finalRead = steps.filter((x) => x.type === 'Identifier' && x.time === 'after').at(-1);
    console.log('  update steps:', upd.map(show).join(' | '));
    console.log('  final s value:', JSON.stringify(finalRead?.value), typeof finalRead?.value);
  }
}

// P5 — optional call on null receiver: short-circuit or throw?
await probe('P5 optional call null receiver', 'const a = null; a?.b();', CFG());

// P5b — optional method call this-binding
{
  const steps = await probe(
    'P5b optional call this-binding',
    'const o = { m: function () { return this === o; } }; const r = o?.m(); r;',
    CFG(),
  );
  if (steps) {
    const finalRead = steps.filter((x) => x.type === 'Identifier' && x.time === 'after').at(-1);
    console.log('  r === (this was o):', JSON.stringify(finalRead?.value));
  }
}

// P6 — continue inside restructured for: update skipped -> infinite -> cap trip?
await probe(
  'P6 continue in for (cap 200)',
  'let n = 0; for (let i = 0; i < 3; i++) { if (n > 100) break; n++; continue; }',
  CFG({ steps: 200 }),
);

// P7 — break statement: before without after?
await probe(
  'P7 break steps',
  'let i = 0; while (i < 5) { i++; break; }',
  CFG(),
  (s) => s.type === 'BreakStatement',
);

// P8 — async arrow: does calling it return a Promise?
{
  const steps = await probe('P8 async arrow', 'const f = async () => 1; const v = f(); v;', CFG());
  if (steps) {
    const finalRead = steps.filter((x) => x.type === 'Identifier' && x.time === 'after').at(-1);
    const v = finalRead?.value;
    console.log('  v is Promise-like:', v != null && typeof v.then === 'function', '| raw:', typeof v, JSON.stringify(v));
  }
}

// P9 — empty code error class
await probe('P9 empty code', '', CFG());

// P10 — maxSteps=5: how many entries recorded before the trip? (message + recorded count)
{
  try {
    await record('for (let i = 0; i < 100; i++) {}', CFG({ steps: 5 }));
    console.log('\n=== P10 === no trip?!');
  } catch (e) {
    console.log(`\n=== P10 maxSteps=5 === ${e.constructor.name}: ${e.message}`);
  }
}

// P11 — runtime SyntaxError (JSON.parse) -> which class?
await probe('P11 runtime SyntaxError', 'JSON.parse("{");', CFG());

// P12 — throw non-Error -> what escapes?
try {
  await record('throw "bare-string";', CFG());
  console.log('\n=== P12 === no throw?!');
} catch (e) {
  console.log(`\n=== P12 throw non-Error === constructor=${e?.constructor?.name} typeof=${typeof e} value=${JSON.stringify(e)}`);
}

// P13 — per-iteration let capture through the for restructure
{
  const steps = await probe(
    'P13 let capture',
    'const fns = []; for (let i = 0; i < 3; i++) { fns.push(function () { return i; }); } const out = fns.map(function (f) { return f(); }); out;',
    CFG({ steps: 3000 }),
  );
  if (steps) {
    const finalRead = steps.filter((x) => x.type === 'Identifier' && x.time === 'after').at(-1);
    console.log('  out:', JSON.stringify(finalRead?.value));
  }
}

// P14 — top-level `this` and global reach inside the "sandbox"
{
  const steps = await probe('P14 global reach', 'const g = (typeof globalThis !== "undefined"); g;', CFG());
  if (steps) {
    const finalRead = steps.filter((x) => x.type === 'Identifier' && x.time === 'after').at(-1);
    console.log('  globalThis reachable:', JSON.stringify(finalRead?.value));
  }
}
