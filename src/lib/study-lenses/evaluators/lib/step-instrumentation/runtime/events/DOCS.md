# step-instrumentation/runtime/events — why this directory exists

The builders are ~20 one-concept files with compile-conformance asserts — a
directory keeps the transplant reviewable file-by-file against its source (the
module README's reuse inventory names it). No abstraction level of its own: the
sketch and data flow are the module's ([`../../DOCS.md`](../../DOCS.md)); the
builders' shared discipline ("the dispatcher stamps base fields") is inherited
from the source layer unchanged.
