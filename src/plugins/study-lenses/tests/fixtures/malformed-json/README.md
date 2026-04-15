# Fixture: `malformed-json/`

Used by `resolve-cascade.test.ts` Increment A.8 ("Exception — malformed
JSON"). `lenses.json` contains intentionally invalid JSON; the test
asserts the resolver throws with the file path in the error message.

Do not "fix" the JSON — breaking the fixture is the point.
