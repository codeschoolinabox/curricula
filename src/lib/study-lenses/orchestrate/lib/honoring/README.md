# honoring

The focus-request honor path: how the `lens` prop becomes — or gracefully does
not become — a mounted lens. One pure decision, taken at mount.

The region [README](../../README.md) owns the honor rules' meaning; this
document owns the decision's mechanics.

## Honored, never obeyed

A focus request names a lens; it is a request, never a bypass:

- **A phase-declaring lens** is honored exactly when the embodiment shows it
  attached to an accessible phase — fit and accessibility both, as embody
  derived them. Attached but barred, or not attached at all: fallback. A
  multi-phase lens mounts at the first accessible phase in its own declared
  order — the lens author's order, no second phase-order truth.
- **A panel-excluded lens** (one declaring no phase) is honored by running its
  own applicability over the embodiment's facts, once, at mount. Applicability
  refuses: fallback. Applicability throws: caught, reported loudly, fallback —
  the same rule embody applies to every gate it wraps.
- **Anything else** — an unknown name, no request at all — is fallback.

Fallback means normal rendering: the environment simply opens as if no request
had been made. The honor path never throws — a wrong `lens` prop is an authoring
slip, not a learner-facing failure.

The decision is a three-armed union — honored in phase, honored panel-excluded,
fallback — and it decides mounting only. The enforcement mask applies to a
focus-mounted lens identically; honoring neither knows nor weakens it.

## Navigation

- Library index: [`../README.md`](../README.md); region root:
  [`../../README.md`](../../README.md).
- [`DOCS.md`](./DOCS.md) — this library's architectural sketch.
- [`types.ts`](./types.ts) — the mount-decision union.
- Siblings: [`../composing/`](../composing/README.md) owns the joined roster the
  request resolves against; [`../recommending/`](../recommending/README.md)
  ranks what fitting lenses propose.
