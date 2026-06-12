# engine/testing — Architecture & Decisions

Vocabulary: [../README.md § Glossary](../README.md).

## Why config-driven reference logic

Worker logic cannot cross the worker boundary as a function — a worker's
behavior is fixed by the entry file it loads. Naively, every failure-mode test
(invalid global key, throwing setup, throwing serializer) would need its own
setup module and its own worker entry. Instead, ONE reference setup derives its
behavior from the clone-safe `workerConfig`: a directive object selects the
failure mode, the worker-global installation, or the default happy path. One
entry file serves every scenario, and the directive channel doubles as live
coverage of `workerConfig` delivery itself.

## Why the engine owns this at all

The engine's consumers (the JEJ tracers, the embody adapter) are separate
campaign workflows. Reference logic keeps the engine's suites self-contained:
trivial worker logic that injects `emit`/`call`/`getConfig`, a halt author that
stamps `viaReference` and recognizes one limit-throw shape
(`ReferenceLimitError`), and thread logic that drops one sentinel
(`'reference:drop'`), echoes string calls, and refines stamped limit halts. That
is exactly enough surface to pin halt carriage, refinement, drop-vs-yield, and
the call channel — with no domain vocabulary imported from anywhere.
