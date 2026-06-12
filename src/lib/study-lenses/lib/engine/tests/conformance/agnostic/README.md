# engine conformance — agnostic tier

One suite body, two transports: these spec modules deliberately carry NO
`.test.ts` suffix (vitest never collects them directly). Each default-exports a
describe-registering factory over an [AgnosticRunner](./types.ts); the two
runner files instantiate every module:

- [fake.test.ts](./fake.test.ts) — node project, the engine-shipped fake
- [real.browser.test.ts](./real.browser.test.ts) — browser project, the real
  worker transport

The single shared body IS the anti-drift claim (README § Conformance testing):
observable divergence between the bootstrap and the fake fails one runner and
not the other. A green fake run proves logic, never transport fidelity — Atomics
blocking, pause ordering, the payload ceiling, and timer behavior live in
[../transport/](../transport/), real-only.
