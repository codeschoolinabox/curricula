<!-- TRANSITIONAL — retires with KLVE-LEDGER.md. -->

# klve-probes

The Pass-3 counter-ledger's measurement scripts: every
`[measured: Pass-3 probe]` row in [`../KLVE-LEDGER.md`](../KLVE-LEDGER.md)
reproduces by re-running these read-only against the quarry's built dist
(imported by ABSOLUTE path —
`/Users/master/Documents/0-teach-code/0-spiralearn/0-study-lenses-committee/sl-trace-js-klve/dist/record/index.js`
— so a run needs read access to that tree; nothing in the quarry is modified).

| script               | round | label prefixes → the rows they back                                                                                                                                                                                                                                                                               |
| -------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `probe-klve.mjs`     | 1     | `P*` — init step numbering (klve-023), return/DEAD (klve-037, r8 v), before-only statements (klve-025/035), string-`++` (klve-042, r8 iii), optional-chain severing (klve-041, r8 iv), continue/let-capture (klve-039, r8 i–ii), cap message (klve-053), ladder edges (klve-061), globalThis reach (klve-083, r5) |
| `probe-klve-r2.mjs`  | 2     | `N*` — getter overflow (klve-084, r8 vi), BigInt (klve-086), null-proto (klve-087), post-await (klve-085, r9), undefined-value key (klve-030), logs-key shape (klve-090), receiver control                                                                                                                        |
| `probe-klve-r2b.mjs` | 2     | the getter-overflow minimal pair (klve-084) and the `S*` module-syntax probes (klve-089, r8 ix)                                                                                                                                                                                                                   |
| `probe-klve-r3.mjs`  | 3     | `T*` — export-route discriminator (klve-089's fallback loc vs a real parse error's loc+`index`+frame), FAKE_CONSTRUCTORS persistence (klve-091), snapshot boundary (klve-092), `Symbol('')` (klve-093)                                                                                                            |
| `probe-klve-r4.mjs`  | 4     | `V1` `.call` error reshape (klve-094, r8 xi) · `V2/V3/V4` async-arrow collapse + control (klve-043, r8 x)                                                                                                                                                                                                         |

Known, deliberate: `probe-klve.mjs`'s P5b/P14 legs CRASH on `JSON.stringify` of
a circular step value — the value is the HOST GLOBAL OBJECT the quarry executor
leaks into learner scope, so the crash IS klve-083's evidence, not probe
breakage (`probe-klve-r2.mjs`'s `safe()` wrapper is the non-crashing form).
