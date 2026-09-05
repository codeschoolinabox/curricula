import record from '/Users/master/Documents/0-teach-code/0-spiralearn/0-study-lenses-committee/sl-trace-js-klve/dist/record/index.js';
const CFG = { meta: { max: { steps: 600, iterations: null, callstack: null, time: 3000 }, range: null, timestamps: false, debug: { ast: false } }, options: { filter: {} } };
const safe = (v) => { try { if (typeof v === 'function') return '[fn]'; return JSON.stringify(v) ?? String(v); } catch { return '[unstringifiable]'; } };

// T1 — export on LINE 3: ParseError.loc discriminates Babel-parse-time (line 3) vs runtime new Function SyntaxError (fallback {1,0})
try {
  await record('let a;\nlet b;\nexport const c = 1;', CFG);
  console.log('T1 export line3: OK?!');
} catch (e) {
  console.log(`T1 export line3: ${e?.constructor?.name}: ${e?.message} | loc=${safe(e?.loc)}`);
}

// T1b — control: a REAL Babel parse error on line 3 carries line 3?
try {
  await record('let a;\nlet b;\nconst = 1;', CFG);
  console.log('T1b parse-error control: OK?!');
} catch (e) {
  console.log(`T1b parse-error control: ${e?.constructor?.name}: ${e?.message} | loc=${safe(e?.loc)}`);
}

// T1c — import on line 3 (invariant error path)
try {
  await record('let a;\nlet b;\nimport x from "y";', CFG);
  console.log('T1c import line3: OK?!');
} catch (e) {
  console.log(`T1c import line3: ${e?.constructor?.name}: ${e?.message} | loc=${safe(e?.loc)}`);
}

// T2 — FAKE_CONSTRUCTORS persists across record() calls: same cname -> same constructor identity?
{
  const code = 'class Foo { constructor() { this.k = 1; } } const f = new Foo(); f;';
  const s1 = await record(code, CFG);
  const s2 = await record(code, CFG);
  const v1 = s1.filter((s) => s.type === 'Identifier' && s.time === 'after').at(-1)?.value;
  const v2 = s2.filter((s) => s.type === 'Identifier' && s.time === 'after').at(-1)?.value;
  console.log('T2 cross-call fake ctor: ctor names', v1?.constructor?.name, v2?.constructor?.name, '| identical constructor object:', v1?.constructor === v2?.constructor);
}

// T3 — non-enumerable and symbol-keyed properties invisible in described values
{
  const steps = await record('const o = { vis: 1 }; Object.defineProperty(o, "hid", { value: 2 }); o[Symbol("s")] = 3; o;', CFG);
  const v = steps.filter((s) => s.type === 'Identifier' && s.time === 'after').at(-1)?.value;
  console.log('T3 snapshot boundary: keys =', safe(Object.keys(v ?? {})), '| hid in v:', v ? 'hid' in v : null, '| symbol keys:', v ? Object.getOwnPropertySymbols(v).length : null);
}

// T4 — Symbol() with no description re-mints as Symbol('')
{
  const steps = await record('const s = Symbol(); s;', CFG);
  const v = steps.filter((s) => s.type === 'Identifier' && s.time === 'after').at(-1)?.value;
  console.log('T4 Symbol() re-mint: typeof', typeof v, '| description:', safe(v?.description), '(native: undefined)');
}
