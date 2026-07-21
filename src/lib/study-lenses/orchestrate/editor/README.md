# editor

The editing surface — the single writer of the program's source. A thin React
component over an async CodeMirror factory; every derived state in the region
re-derives from what is written here.

The region [README](../README.md) owns what the orchestrator renders and the
[region glossary](../README.md#glossary--region-terms) owns the shared terms;
this document owns the editing surface's own contract.

## The single writer

Only this surface mutates the program's source. It emits one **edit event** per
document change — per keystroke, carrying the full source — and nothing else:
the settle debounce is the top component's, never the editor's. The editor does
not know what a settle is.

Writes flow one way per channel: a learner's typing raises edit events upward; a
programmatic write (the top component setting content) replaces the document
without echoing an edit event — an own-write never comes back as an edit.

## The callback boundary

The factory wraps CodeMirror entirely: callbacks never see or return CodeMirror
types, and no CodeMirror value crosses out of this directory. The factory
resolves to an editor instance — content read, content write, destroy — and
after destroy the instance is a dead sentinel: reads return the empty string,
writes and repeated destroys are no-ops, and no callback ever fires again.

## The level-adapter seam

The selected level's editor-support data — completion, hover, format — reaches
CodeMirror through the one generic adapter that lives with this surface. A level
ships data, never editor code; the adapter is the only place that data becomes
editor behavior.

## Diagnostics are supplied, never derived

The editor ships no validator. Every diagnostic it renders — the selected-level
gutter's markers included — arrives orchestrator-supplied, fed exclusively from
the region's one memoized validate. This is the double-parse guard: nothing in
the editor parses the program for judgment; CodeMirror's own tokenizer
highlights syntax and does nothing more.

## Home base — always reachable

The editor is surface class 1: never masked while mounted, because editing is
how conformance is restored — and it is the home base, not a permanent fixture.
A lens excursion unmounts this surface entirely (CodeMirror is destroyed); edits
survive every excursion because the buffer lives in the region's live-source
slot, not in this component, and each mount seeds from it. What the postures
must keep alive is the PATH back — and the guaranteed way home is the Edit code
button: class 2, alive under every posture. The strip's none entry closes too,
but the strip is class 3 and inert while masked — which is exactly why the
class-2 button exists. A mount failure never takes the page down — the component
renders a fallback carrying a data attribute in place of the surface.

## Navigation

- Region root: [`../README.md`](../README.md) — the host surface and the
  region's mechanics.
- [`DOCS.md`](./DOCS.md) — this surface's architectural sketch.
- [`types.ts`](./types.ts) — the editor instance and callback contracts.
- Siblings: [`../phases-panel/`](../phases-panel/README.md) renders the study
  layer; [`../lib/composing/`](../lib/composing/README.md) resolves the
  configuration the top component passes down.
