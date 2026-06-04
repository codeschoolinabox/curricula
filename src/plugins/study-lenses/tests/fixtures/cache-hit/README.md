# Fixture: `cache-hit/`

Used by `resolve-cascade.test.ts` Increment A.5 ("Interface — cache hit").
Dedicated (not shared with `single-level/`) so the test's first `resolveCascade`
call is a true cache miss rather than a hit populated by an earlier test in the
file.
