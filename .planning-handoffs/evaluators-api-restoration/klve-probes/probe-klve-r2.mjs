// Counter-ledger ROUND 2 probe. Read-only import of the quarry dist.
import record from '/Users/master/Documents/0-teach-code/0-spiralearn/0-study-lenses-committee/sl-trace-js-klve/dist/record/index.js';

const CFG = (metaOver = {}, options = { filter: {} }) => ({
  meta: {
    max: { steps: 600, iterations: null, callstack: null, time: 3000, ...metaOver },
    range: null,
    timestamps: false,
    debug: { ast: false },
  },
  options,
});

const safe = (v) => {
  try {
    if (typeof v === 'function') return '[fn]';
    return JSON.stringify(v) ?? String(v);
  } catch {
    return '[unstringifiable]';
  }
};
const show = (s) =>
  `#${s.step} ${s.category}${s.type ? ' ' + s.type : ''}${s.time ? ' ' + s.time : ''}${'value' in s ? ' value=' + safe(s.value) : ' (no value key)'}${'logs' in s ? ' logs=' + safe(s.logs) : ' (no logs key)'}`;

async function probe(label, code, cfg = CFG(), filter = null) {
  try {
    const steps = await record(code, cfg);
    const picked = filter ? steps.filter(filter) : steps;
    console.log(`\n=== ${label} === (${steps.length} steps total)`);
    for (const s of picked) console.log('  ' + show(s));
    return steps;
  } catch (e) {
    console.log(`\n=== ${label} === THREW ${e?.constructor?.name}: ${e?.message ?? safe(e)}`);
    return null;
  }
}

// N1a — continue in a WHILE loop (avoids the r8 for-defect): before-only?
await probe(
  'N1a continue steps (while)',
  'let i = 0; while (i < 2) { i++; continue; }',
  CFG(),
  (s) => s.type === 'ContinueStatement',
);

// N1b — throw statement: before-only? (caught so the trace completes)
await probe(
  'N1b throw steps (caught)',
  'try { throw new Error("x"); } catch (e) {}',
  CFG(),
  (s) => s.type === 'ThrowStatement',
);

// N2 — undefined-valued EXPRESSION loses its value key in output (data.value default true)
await probe(
  'N2 undefined expression value key',
  'let x; x;',
  CFG(),
  (s) => s.type === 'Identifier',
);
await probe('N2b void 0', 'void 0;', CFG(), (s) => s.type === 'UnaryExpression');

// N3 — optional method call receiver: this === o ?
{
  const steps = await probe(
    'N3 optional call receiver',
    'const o = { m: function () { return this === o; } }; const r = o?.m(); r;',
    CFG(),
    (s) => s.type === 'Identifier' && s.time === 'after',
  );
  if (steps) {
    const last = steps.filter((s) => s.type === 'Identifier' && s.time === 'after').at(-1);
    console.log('  r (this === o):', safe(last?.value), '   [plain o.m() natively: true]');
  }
}
// N3-control — the same call WITHOUT optional chaining
{
  const steps = await probe(
    'N3-control plain method call receiver',
    'const o = { m: function () { return this === o; } }; const r = o.m(); r;',
    CFG(),
    (s) => false,
  );
  if (steps) {
    const last = steps.filter((s) => s.type === 'Identifier' && s.time === 'after').at(-1);
    console.log('  r (this === o):', safe(last?.value));
  }
}

// N9 — Object.create(null) described?
await probe('N9 Object.create(null)', 'const o = Object.create(null); o;', CFG(), (s) => false);

// N10 — getter side effects: how many times does the getter fire under tracing?
{
  const steps = await probe(
    'N10 getter invocation count',
    'let n = 0; const o = { get g() { n = n + 1; return 1; } }; o; n;',
    CFG(),
    (s) => false,
  );
  if (steps) {
    const last = steps.filter((s) => s.type === 'Identifier' && s.time === 'after').at(-1);
    console.log('  n after tracing:', safe(last?.value), '   [natively: 0 — o is never read via .g]');
  }
}

// N11 — BigInt described?
await probe('N11 bigint value', '10n + 5n;', CFG(), (s) => s.type === 'BinaryExpression');

// N12 — async function: are post-await steps traced?
{
  const steps = await probe(
    'N12 async continuation',
    'let mark = 0; async function f() { mark = 1; await 0; mark = 2; } f(); mark;',
    CFG(),
  );
  if (steps) {
    const assigns = steps.filter((s) => s.type === 'AssignmentExpression' && s.time === 'after');
    console.log('  assignment steps seen:', assigns.map((s) => safe(s.value)).join(', '), '  [mark=2 step present?]');
    const last = steps.filter((s) => s.type === 'Identifier' && s.time === 'after').at(-1);
    console.log('  final mark read in-trace:', safe(last?.value));
  }
}

// N4 — logs key presence on a step with no logging
{
  const steps = await probe('N4 logs key on quiet steps', 'let x = 1;', CFG(), () => true);
}
