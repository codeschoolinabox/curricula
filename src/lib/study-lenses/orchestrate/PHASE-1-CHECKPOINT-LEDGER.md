# orchestrate campaign — deferred 🔍 checkpoint ledger

Transitional scaffolding beside PHASE-1-HANDOFF.md; the maintainer deletes it
when the campaign completes. Per the maintainer's 2026-07-18 mandate, 🔍 sandbox
checkpoints do not block on the maintainer's presence: agents verify what tests
can verify, commit with the checkpoint deferred (noted in the commit body), and
record here every named action + expected observation for the maintainer to
replay at the end.

Replay setup: `npm start`, then visit the page each entry names.

| Increment | Commit              | Page              | Named action                                     | Expected observation                                                                                                                                                       |
| --------- | ------------------- | ----------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W1-E3     | (this row's commit) | `/sandbox/editor` | type into the editor; paste a multi-line snippet | keystrokes render; exactly one editor on the page; the relay line counts every edit and reports the latest length; browser console clean; NO completion popup while typing |

Entries append as 🔍-bearing increments land. Wave 0 carried no 🔍.
