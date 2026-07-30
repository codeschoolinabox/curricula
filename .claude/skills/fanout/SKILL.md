---
name: fanout
description:
  Launch an orchestrated worker fan-out with measured baselines in every brief.
---

# fanout

Run the orchestrated delegation fan-out per the AGENTS files' § Orchestrated
delegation — this skill is the launch checklist, not a replacement for that
section.

## 1. Decompose from the type-defined DAG

Dispatch is mechanical: read the dependency DAG the human locked at the Phase-0
→ Phase-1 gate. A type edge serializes that pair. Everything else runs PARALLEL
BY DEFAULT — serializing work the DAG allows in parallel wastes the human's
wall-clock and saves no tokens (human ruling 2026-07-29). Before launching,
sweep the candidates for non-type couplings (environment colocation,
frozen-singleton or registration order, semantic protocol): a cleared sweep
launches parallel; a coupling you cannot clear serializes THAT PAIR only, never
the wave; a hidden dependency the types cannot see is a `types.ts` modeling gap
to surface, not a reason to go serial.

## 2. Measure the baselines, paste the output

Run `node scripts/repo-facts.mjs` and paste its OUTPUT verbatim into every
worker brief. Whether injected facts reach a spawned worker is a harness
behavior this repo does not currently measure (harness-probe covers router
reach, not SessionStart) — so the orchestrator ALWAYS pastes the script's OUTPUT
verbatim, never a retyped number. The brief's quality bar cites these baselines:
the worker's own directory fully green, zero NEW failures outside the named
baseline paths, whole-repo green explicitly NOT the gate.

## 3. Every brief is a cold start

Each worker brief carries: the module README/DOCS/types paths, the cluster
contract, the pasted baselines, AND the explicit instruction to read its own
governance file per the repo-root `CLAUDE.md` router before starting (reach of
the router text into a spawned context has been observed in both directions —
measured present 2026-07-29, absent 2026-07-28; the explicit step is the
contract). Spawn workers as `subagent_type: tdd-worker` — the registered
contract covers the ceremony, commit form, and DONE/BLOCKED/FLAG reporting.

## 4. Validate the decomposition context-free (mandatory)

Per the governance rule "Validate every handoff with a context-free agent" (cite
by heading and name, never by number), applied to launches: before each wave, a
fresh agent holding only the launch prompts plus repo access reports where each
worker would stumble, guess, or block. Apply must-fix findings first.

## 5. Run the wave

Workers report DONE | BLOCKED | FLAG. A worker's AR PAUSE bubbles to the human
with the reviewer's proposed resolution while every independent thread keeps
moving. The orchestrator reads committed contracts at DAG joins to catch
seam-slop, writes no per-worker churn, and serializes its own spine edits.
🔍-bearing (user-observable) increments never fan out.
