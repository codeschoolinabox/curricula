# computational-thinking/ — resume point

> Written 2026-09-03 by the session that produced the directory. Revised once
> after a context-free reader audited it and returned USABLE WITH FIXES.

## How to use this

This is **not** a state dump. The documents are readable and self-describing;
start at their `README.md` and the reading order will orient you in under an
hour. Re-narrating them here would be waste.

What follows is the part you cannot reconstruct: **where the previous session
suspects it was wrong**, plus the operating frame that is genuinely state.
Auditing a named fragile point is bounded work. Rebuilding someone's theory of a
document set is not — which is the argument the directory itself makes, and the
reason this file is shaped this way.

## Operating frame

- **Goal.** `computational-thinking/` stands on its own as an argument about
  what computational thinking is. It does that now. **The campaign is at a human
  gate, not mid-flight** — nothing is half-done. Redrafting the F&V course
  around it is a separate, later campaign that has not been authorised.
- **Ceremony.** Documentation commits take the full AR cycle in this repo. The
  five doc commits below predate that being applied to this directory; if you
  extend the set, run it.
- **Commit settings line.**
  `work: curriculum authoring · twin-doc: none · prospective` (or
  `retrospective` when correcting committed work). Governance edits use
  `work: governance`.
- **Network fetch is available** — `WebFetch` works, and Naur was fetched with
  it. Note the standing rule below about what a fetch is not.
- **Scope boundary.** No F&V curriculum file has been touched. The campaign's
  commits reach exactly two places: everything under `computational-thinking/`,
  and `DEV.md` once, for the governance change `6c34c970` made on explicit
  instruction [measured 2026-09-03: `git log --name-only 8882352d~1..8f20eb34
  --pretty=format: | sort -u`]. `tie-ins.md` is a table of **findings** about
  F&V, not a work order — do not act on its rows.

## Decision rights

The validator found four of nine items below blocked on this, so it is stated
explicitly.

**You may settle in-session:** items 2, 5, 6, 7, 8, and drafting the C4
half-beat. These extend or verify the argument without altering a ruling.

**These produce a proposal for the human, not a decision:** items 1, 3, 4 and 9.
Each touches something already ruled, or a curriculum-identity choice.
`DOCS.md`-class artifacts and the ruling list are the human's.

**Governance surface** — `DEV.md`, `AGENTS*.md`, `CLAUDE.md`, `.claude/**` — is
never edited without explicit human instruction in the conversation.

## State

Seven commits on `main`, none pushed (`main` has no upstream, so "unpushed" is
consistent with the tree rather than directly verifiable).

| SHA        | What                                                         | Rulings it records                                                  |
| ---------- | ------------------------------------------------------------ | ------------------------------------------------------------------- |
| `8882352d` | the document set established                                 | condition-3 split; F's far target; V-as-CT is pedagogy not ontology |
| `99bfcce1` | L1/L6 rename, condition (c), CT by way of a notional machine | modelling/meaningful; predictive usefulness; Ch1 half-beats F-only  |
| `3504af6a` | Naur read in full                                            | essay-vs-experiment distinction; the attribution hazard             |
| `9b161cda` | Naur's decay mechanism                                       | decay is not a context-size problem                                 |
| `596554bc` | `this-codebase.md`                                           | Naur's remedies invert for an LLM collaborator                      |
| `6c34c970` | **governance** — twin-doc conformance check in AR-4          | conformance not judgement; FLAG don't decide; states its own limit  |
| `8f20eb34` | two decayed greps and one stale governance claim fixed       | —                                                                   |

Eleven authored Markdown files plus two figures — `the-chain.svg` and
`the-stack.svg` — and the Naur transcription. `markdownlint` returns 0 across
the authored set; all six remaining errors in the directory are in
`programming-as-theory-building.md`, a verbatim source transcription left
unreformatted on purpose [measured 2026-09-03]. All relative links resolve.

**Not mine, leave alone:** `draft.mmd` and `on-pseudocode.md` (both untracked;
`on-pseudocode.md` is currently 0 bytes). The tracked provenance — `plann.txt`,
`from-a-job-application/`, the Weintrop PDF — is in scope but historical;
`README.md` § Provenance says how each is treated.

## Where I suspect I am wrong

1. **The L6 node may be two nodes.** `meaningful computation` bundles
   _participation_ (the artifact becomes part of the system it models) with
   _audience uptake_. Grice's meaning-nn covers only the second. Defined in
   `thesis.md` § L6, restated in `meaning.md` and `README.md` § The claim —
   check all three. **Proposal only**: L6's name is a ruling.
2. **"By way of a model of the target" may only assert what it claims.**
   `thesis.md` § L4 says this generalisation stops computational thinking
   collapsing onto F. Test it against V: what is the model when the target is a
   person, and does the rest of the chain still apply? `tie-ins.md`'s
   `ontology.md:936-946` row is the material to test with. **Settle
   in-session.**
3. **"Modelling computation" is untested against a learner.** It replaced
   "meaningful" partly because that read as praise; "modelling" may read as
   jargon, which is a different failure, not a fixed one. **No LLM session can
   run this** — it needs a human who is learning. Flag it to the human rather
   than attempting a proxy.
4. **`domain.md` owes an answer to _which community_.** Weintrop's disciplines
   are communities whose real problems supply the assignments. "User-facing,
   text-manipulating, rhetorically-situated programs" names a stack and an
   audience posture. **Proposal only** — this is curriculum identity, and
   inventing a community would violate the wording rule below.
5. **The CER experiments are uncited and load-bearing.** That experts perform
   like novices in an unfamiliar domain is _experimental_; Naur wrote an essay
   offering a mechanism. The whole learning-to-program → programming-to-learn
   architecture leans on the finding. No candidate papers are named anywhere —
   finding them is the task. **Settle in-session**, fetch first.
6. **Type versus token is unresolved.** `thesis.md` § L3's blockquote. A
   programming language is a type; an algorithm is closer to a token. **Settle
   in-session** and record it as a ruling.
7. **Every `Owed:` marker is a live fabrication risk.** Putnam, Searle,
   Piccinini, Grice, Ryle, diSessa, Wing, Papert, du Boulay, Sorva, Stefik &
   Siebert, METR — none fetched. Naur and Weintrop are the only sources read.
   **Rule, not a unit:** do not cite an `Owed:` source without fetching it.
8. **The seam-drift prediction has no instrument.** `this-codebase.md` stakes
   that this repo's leaves are in better shape than its cross-module contracts.
   As written that is a wish, not an audit item — it does not say what counts as
   a seam versus a leaf, what is measured (bug-fix commit density? revert count?
   AR blocker origin?), or what would falsify it. **Building the instrument is
   the unit**; running it is downstream.
9. **Whether the DAG should branch.** One path out of modelling computation adds
   an observer and a notation and reaches computational thinking; the other adds
   an audience and reaches meaningful computation. The second may need neither
   legibility nor notation, in which case the two hats fall out of the DAG
   structurally. Raised, never worked. **Proposal only.**

**Three further gaps named in `README.md` § Known gaps that are not above** —
the spiderweb-topology placement of computational thinking, whether target
systems are localisable by partner communities under the Reusability Paradox,
and the undrafted C4 half-beat. This list is not a superset of that one; read
both.

## Standing rules this session kept breaking

- **Keep the human's wording where they have stated something from context and
  experience.** Violated three times — a pedagogy ruling hardened into an
  ontological one, "algorithm" substituted for "idea", a reviewer's
  interventionism written into condition (c) in the author's voice. The pattern
  was named in writing after the second, and then happened again. Assume you
  will do it too.
- **Run the string you publish.** Two published greps had decayed by the time
  the directory was finished; both were in committed prose and neither was
  caught by the author. `grep` here is ugrep. **A count whose subject includes
  the document stating it will decay — do not publish one.**
- **A summarised fetch is not a read.** Naur was cited across a commit on the
  strength of a targeted `WebFetch`. Reading the essay surfaced his opening
  definition — the closest line in the paper to the claim being made — and an
  attribution hazard.
- **`programming-as-theory-building.md` lines 599+ are not Naur.** Another,
  unattributed author. Nothing there may be quoted under his name.

## Suggested next unit

**Draft the C4 half-beat.** It is named as owed in `half-beat.md` § "Still owed"
and in `README.md` § "How to check this directory", where it is the directory's
declared falsification instrument: hand `epicycles.md` and `half-beat.md` to a
reader who has never seen F&V and ask them to draft it — "if they cannot, the
set does not hold, however well the thesis reads."

It is bounded, self-contained, needs no fetch, touches no F&V file, and produces
a binary result. It is also the only available unit that **tests** the argument
rather than extending it.

(An earlier revision suggested the fan-out/twin-doc question instead. That is
governance-adjacent, so its only possible output is a proposal, and `6c34c970`
has already landed the review-side half of it.)
