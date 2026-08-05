# orchestrate campaign — deferred 🔍 checkpoint ledger

Transitional scaffolding (its campaign brief is recalled from git history:
`git show 40c3f88:src/lib/study-lenses/orchestrate/PHASE-1-HANDOFF.md`); the
maintainer deletes it when the campaign completes. Per the maintainer's
2026-07-18 mandate, 🔍 sandbox checkpoints do not block on the maintainer's
presence: agents verify what tests can verify, commit with the checkpoint
deferred (noted in the commit body), and record here every named action +
expected observation for the maintainer to replay at the end.

Replay setup: `npm start`, then visit the page each entry names.

| Increment | Commit              | Page                                                                                                               | Named action                                                                                                                                                                       | Expected observation                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------- | ------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W1-E3     | (this row's commit) | `/sandbox/editor`                                                                                                  | type into the editor; paste a multi-line snippet                                                                                                                                   | keystrokes render; exactly one editor on the page; the relay line counts every edit and reports the latest length; browser console clean; NO completion popup while typing                                                                                                                                                                                                                                                                                                          |
| W1-P1     | (this row's commit) | `/sandbox/phases-panel`                                                                                            | read both panels; click a lens name in each panel                                                                                                                                  | first panel: five sections in spec order with display labels; second panel: ast/environment/evaluation barred, each naming the parser's cause, no lens buttons on barred sections; every click updates the intent line with the right lens AND phase                                                                                                                                                                                                                                |
| W3-L1     | (this row's commit) | `/sandbox/level-ui`                                                                                                | click each of the four prepared programs; open the selector list; hover the Scaffold entry; click both entries; flip strict                                                        | the Scaffold entry's mark cycles fits / does-not-fit / not-applicable-for-type / undetermined with the programs; hover shows the reference docs as a plain tooltip; the closed face tracks selection including back to the none-state; the strict toggle shows and flips the posture; every intent echoes below                                                                                                                                                                     |
| W4-T1     | (this row's commit) | `/sandbox/orchestrate`                                                                                             | type until the debounce settles; break the parse (`1 +`) and fix it; click the type toggle; open the level list and select Scaffold; open a phase's lens                           | the editor mounts once with the seed program; a settle re-renders the phases; broken parse bars environment/evaluation naming the parser's cause and fixing reopens them; the toggle text flips and re-derives instantly; the selector face tracks the scaffold's live mark; the panel's five sections carry the display labels in spec order                                                                                                                                       |
| W4-T2     | (this row's commit) | `/sandbox/orchestrate`                                                                                             | select Scaffold, enable strict, type a `debugger;` statement; delete it; break the parse under strict; try to click and Tab into the covered panel while masked                    | the study panel masks with an overlay naming Scaffold and the debugger violation; deleting it unmasks after the settle; a broken parse shows NO mask (the parse supports stay uncovered); while masked the covered surfaces take no click or keyboard focus, and the editor, selector, both toggles, and guide stay operable                                                                                                                                                        |
| W4-T3     | (this row's commit) | `/sandbox/orchestrate`                                                                                             | load the page (the harness injects a "notes" lens and names it as the initial focus); open a phase lens over it; enable strict with a `debugger;`                                  | the notes lens is open at load, honored without a click; clicking another lens replaces it (the honored focus is a default, never a lock); under strict + violation the mask covers the focus-mounted lens identically to the panel                                                                                                                                                                                                                                                 |
| W4-G1     | (this row's commit) | `/sandbox/orchestrate` (rides the full-instrument gate — no standalone page; the guide takes no props to exercise) | click the guide reveal; read the topics; click the reveal again                                                                                                                    | collapsed by default; opening lists the four orientation topics (phases · levels · posture · snippet-type) each titled below the panel's phase headings, after the panel in DOM order; closing hides them; the guide stays operable under strict                                                                                                                                                                                                                                    |
| W4-T4     | (this row's commit) | `/sandbox/orchestrate`                                                                                             | click the "study the source" recommendation the notes lens raises; then open the notes lens from the panel                                                                         | the recommendation affordance lists under the phases; clicking it opens the proposed lens carrying the proposal's config (the note names its origin); opening from the panel afterwards clears the proposal's overrides; under strict + violation the recommendation surface sits beneath the mask                                                                                                                                                                                  |
| GATE      | (this row's commit) | `/sandbox/orchestrate`                                                                                             | the WORKFLOWS learner walkthrough, live: paste broken JS; fix it; select Scaffold + strict with a `debugger;`; toggle the type; open lenses; reveal the guide                      | broken JS is explained where it breaks and the later phases wait; fixing reopens them; strict masks only while out of level and never the editor, selector, toggles, or guide; the type toggle re-derives immediately (the not-applicable path reachable); every control alive throughout                                                                                                                                                                                           |
| SWAP-2    | (this row's commit) | `/sandbox/orchestrate`                                                                                             | load the page (the editor mounts with the seed); open notes from the Source select; close it; type an edit; open parsons; close it                                                 | the EDITOR is the pane at load (editor-first default — no lens prop); an opened lens REPLACES it (never below it); closing returns the editor holding your edits intact                                                                                                                                                                                                                                                                                                             |
| EDIT-3    | (this row's commit) | `/sandbox/orchestrate`                                                                                             | open any lens from the Source select; find and click the Edit code button in the control row; then select Scaffold + strict, type `debugger;`, open parsons, click Edit code again | in editor mode (including at load) the button is ABSENT; while a lens is open it leads the control row and clicking it returns the editor with edits intact; while MASKED with a lens open the button stays clickable — the strip is inert and the button is the guaranteed way home                                                                                                                                                                                                |
| DISP-4    | (this row's commit) | `/sandbox/orchestrate`                                                                                             | open parsons; click the type toggle                                                                                                                                                | the toggle closes parsons FIRST and lands you back in the editor under the new type (a derivation-context change never happens beneath an open lens); toggling with no lens open behaves as before                                                                                                                                                                                                                                                                                  |
| DISP-5    | (this row's commit) | `/sandbox/orchestrate`                                                                                             | open parsons; pick a level from the selector; open parsons again; flip strict                                                                                                      | each derivation-context commit closes the open lens FIRST and lands you in the live editor — no change ever happens beneath a mount. The masked-honored variant (strict + violation at load over a focus lens) needs a harness prop edit (lens + activeLanguageLevel + strictLanguageLevels + a `debugger;` seed); it is pinned by the jsdom tests "disposes an honored lens and unmasks in the same posture commit" and "disposes an honored lens on a type toggle under the mask" |
| FLUSH-6   | (this row's commit) | `/sandbox/orchestrate`                                                                                             | type a fresh line and IMMEDIATELY (before the debounce lands) open parsons; click Edit code                                                                                        | the lens opens over the code exactly as typed — pending keystrokes are absorbed at the open, never discarded — and Edit code returns the editor holding them. (Parsons is text-tier, so it stays open over broken code; the self-close of a lens whose applicability needs the parse is pinned by the jsdom gate test "never mounts a lens the flushed facts reject".)                                                                                                              |

| GEN-4 | `6d4fa40a` | `/spiralearn/sandbox/generator` | ask with a prompt and
let it answer; click Start over; ask again and click Stop mid-flight; ask with a
prompt beginning `refuse:`; click Discard | REPLAYED LIVE, NOT DEFERRED — see
the note below. The stage reports replace one another and the reset control
reads Stop mid-flight, Start over over an answer; Accept and Discard appear only
once there is an answer and Accept never appears over a refusal; Start over
closes the output, keeps the prompt, and re-arms the ask; Discard raises the
return home and leaves the refusal standing |

| GEN-5 | `(this row's commit)` | `/spiralearn/sandbox/orchestrate` | load the
page and read the control row; click Generate code; Tab from the top of the
document to the prompt field; type a fresh line and IMMEDIATELY click Generate
code; click Edit code; ask with a prompt and click Accept; ask and click
Discard; open the generator and click the type toggle; open the generator and
pick notes from the Source select | REPLAYED LIVE, NOT DEFERRED — all nine
actions verified in real Chromium, browser console clean throughout, no
behavioral defect. In editor mode the control row reads `Generate code` with no
Edit code button; clicking it replaces the editor (0 editors) with the view,
seeded with the harness program verbatim, the takes-time warning already on
screen, Edit code now present and Generate code withdrawn; the view mounts in
the SECOND maskable region and not the strip's (`[false, true]`, the same
assertion shape the jsdom test carries). The flush-at-open seeds
`let justTyped = 42;` exactly as typed, and Edit code returns it intact. Accept
lands the candidate byte-for-byte — 158 characters in the preview, 158 read back
out of the buffer, `identical: true` [measured: the candidate's `<pre>`
textContent compared against the reopened seed's]. Discard leaves
`const untouched = 1;` untouched. The type toggle closes the generator first and
lands in the editor reading `script`; picking notes from the Source select
replaces the generator with the lens, the editor still absent and Edit code
still present. **One cosmetic observation, R-11's**: reaching the prompt field
takes SIX Tab presses from the top of the document — Edit code, the type toggle,
the level face, the strict toggle, one phase select, then the prompt. Reachable,
so a cosmetic redirect rather than a barrier; it rolls into a later increment
per the redirect policy, and pane-swap focus stays unspecified by R-11. |

| GEN-6 | `(this row's commit)` | `/spiralearn/sandbox/orchestrate` | open the
generator, then: open the level face and pick Scaffold FROM INSIDE the open
popover; click the strict toggle; click the `notes` recommendation; ask and then
toggle the type while a stage report is still on screen; and separately, type
`1 +` and IMMEDIATELY click Generate code | REPLAYED LIVE — five actions in real
Chromium, browser console clean, no behavioral defect. Two of these carried
browser-only risk jsdom structurally cannot show, and both came back clean.
**The popover hazard:** the level list WAS open at the moment of the click
(`popoverWasOpenWhenClicked: true`), the generator vanished, the editor returned
with the buffer intact, the face read `Scaffold · fits`, and the popover did NOT
orphan itself open over the remounted editor. **The prose claim R-13b sent here
instead of a test:** with `Getting the generator ready…` on screen, toggling the
type ended the excursion and **nothing painted late** — no output slot, no
preview, no generator node 2.2s later, well past the placeholder's ~800ms of
staged delay. That is the takes-time warning's promise (_"Leaving this view ends
it — and so does changing the level, the posture, or the snippet type"_) honored
in a browser. The posture toggle swapped cleanly with `aria-pressed` flipping to
`true`; the `notes` recommendation replaced the generator with the LENS (editor
still absent, Edit code still present, Generate code still withdrawn), which is
the vector this increment's one genuine triangulator pins; and a generator
opened over `1 +` STOOD, seeded `1 +` verbatim, with `environment` and
`evaluation` barred behind it — the orphan defense correctly ignoring an arm
that names no lens. **One cosmetic observation, R-11's again and at its worse
case:** when a control the learner did not aim at the pane closes the generator
under them, focus falls to `body`. Reachable and non-blocking, so it rolls
forward; it is the same finding GEN-5 raised from the other direction. |

Entries append as 🔍-bearing increments land. Wave 0 carried no 🔍.

**GEN-7 — NO SANDBOX CHECKPOINT, declared and maintainer-approved.** Increment 7
is test-only: it wrote **zero implementation code**, and `orchestrate/index.tsx`
and `use-settled-snippet.ts` are byte-identical to their parents [measured: `git
diff --exit-code` on both paths]. It adds **no user-visible surface**, which is
[DEV.md § Sandbox Checkpoints](../../../../DEV.md#sandbox-checkpoints--user-observable-features)'s
sanctioned skip category (_"increments with no user-visible surface"_). The
behavior it pins was already replayed live: **GEN-5** exercised Accept
(byte-for-byte, 158 = 158) and Discard, **GEN-6** the mid-flight kill. Recorded
rather than left silent because a lapsed checkpoint is precisely the failure the
section exists to prevent. **Why this differs from Increment 6**, which was also
pin-only and still ran GEN-6 live: that increment had a specific claim routed to
the checkpoint by R-13b (the takes-time warning's abort promise). Increment 7
routes nothing. **One thing a live GEN-7 would very likely have surfaced:**
R-11's THIRD sighting — focus falling to `body` when Accept or Discard closes
the generator under the learner. Two sightings already stand (GEN-5, GEN-6), and
a third promotes R-11 to its own increment; that promotion is now expected on
whichever checkpoint next runs live.

**GEN-4 broke the deferral pattern deliberately, and the maintainer ruled it.**
The 2026-07-18 mandate above defers 🔍 rows to this ledger because checkpoints
were not to block on the maintainer's presence. Increment 4's AR-4 pointed out
that the generator view had no page at all — three increments of UI had shipped
unseen — and that `spiralearn/sandbox/editor/index.mdx` had already set the
pattern: a ~40-line leaf-mount harness needing no orchestrator wiring. The
maintainer ruled build-it-and-run-it, so
`spiralearn/sandbox/generator/index.mdx` now exists and GEN-4 was replayed live
rather than recorded for later. Outcome: no behavioral defect. The one
observation raised — every candidate carries the placeholder's marker comment —
is the socket's specified output, not a defect
([generator/README.md § The placeholder socket](./generator/README.md#the-placeholder-socket)).

⚠️ **The routes in this table's older rows are stale by a prefix.** They read
`/sandbox/…`; the served route is `/spiralearn/sandbox/…` [measured: the
generated `path:` entries in `.docusaurus/routes.js`]. A dev server also serves
a client-rendered shell, so a `curl` against a MISSING route still returns 200 —
verify a page with a real browser, never a status code.

> **Swap supersession note (the c65e0c7 re-spec).** Three earlier rows pinned
> coexist-era observations; the rows stay verbatim for historical replay, but
> replay them against the swap semantics: W4-T2's "the editor … stay[s]
> operable" holds while the editor is MOUNTED (it is structurally absent during
> a lens excursion; the way back — the none entry, later the Edit code button —
> is what stays operable); W4-T3's "clicking another lens replaces it" now
> replaces the EDITOR too; GATE's "never the editor" masking claim reads "never
> the editor while mounted".

> **Editor-first flip (2026-07-21, maintainer ruling).** The harness no longer
> names a focus lens: the page now demonstrates the editor-first DEFAULT (the
> public contract — editor unless `lens=` names one). The swap-era rows above
> were updated to match; the honored-at-load variant is prop-driven,
> jsdom-pinned, and was machine-replayed before the flip.

## Machine replay — 2026-07-21 (the swap rows, maintainer-delegated)

The five swap-era rows (SWAP-2 · EDIT-3 · DISP-4 · DISP-5 · FLUSH-6) plus the
mask-geometry check were replayed headless — Playwright driving real Chromium
against `npm start`, through the real DOM: **14/14 named observations verified,
browser console clean throughout.** Live finding folded back into FLUSH-6's
wording: parsons (text-tier) STAYS open over broken code — the reachability
self-close belongs to parse-gated lenses, which the jsdom gate test pins.
Screenshots reviewed: the honored load (notes occupies the pane, no editor, Edit
code leads the control row) and the masked editor mode (the overlay names the
violation over the content region only; the strip dims inert; the editor stays
alive and framed). DISP-5's masked-honored variant remains jsdom-pinned per its
row note (needs a harness prop edit to replay live).

## Machine replay — 2026-07-20 (maintainer-delegated)

The maintainer ruled the replays delegated ("no time for replays — do your best
with browser and code review"). All nine rows were replayed headless —
Playwright driving real Chromium against `npm start`, exercising every named
action above through the real DOM (typing, pasting, clicking, toggling, masking,
tabbing): **43/43 named observations verified, browser console clean across
every page and the whole GATE walkthrough.** The one class of observation a
machine cannot judge — subjective visual quality — was reviewed via screenshot:
the editor's affordance frame, the masked overlay's legibility (the study region
ghosted beneath the centered blocked sentence while the editor, selector,
toggles, and guide stay fully alive), and the type-admission blocked state. No
behavioral defect found; no cosmetic redirect raised.
