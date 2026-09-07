# step-instrumentation/runtime — why this directory exists

One decision, recorded once: the realm split is a DIRECTORY so a wrong-realm
import is visible in the path, not discovered at bundle time (the engine's
fix-realms-by-import-graph discipline; ar-1 2026-09-06). The architectural
sketch, the data flow, and every structural constraint live in the module's own
[`../DOCS.md`](../DOCS.md) — this directory adds no abstraction level of its
own, so it carries no second sketch. Import direction: modules here import
[`../types.ts`](../types.ts) and each other; never the seam, the transform, or
the thread-side codec half.
