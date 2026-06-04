# Fixture: `contentroot-isolation/`

Used by `resolve-cascade.test.ts` Increment A.7 ("Interface — contentRoot
isolation"). Dedicated (not shared with `two-level-cascade/`) so that A.7's
wide-call cache key does not collide with A.3's, which would otherwise turn the
wide-call computation into a cache hit rather than a fresh compute.
