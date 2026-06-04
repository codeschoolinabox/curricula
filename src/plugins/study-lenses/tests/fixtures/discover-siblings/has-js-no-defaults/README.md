# Fixture: `has-js-no-defaults/`

Used by `discover-siblings.test.ts` B.3 ("`.js` files exist but
`config.defaults.js` is unset → frozen []"). Contains a single `foo.js`. The
test passes a config whose `defaults` is empty; the walker must skip `foo.js`
because `js` is not configured.
