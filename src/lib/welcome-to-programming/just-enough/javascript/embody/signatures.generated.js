// see phases/ for draft nm outline
// all data structures are fully entwined with precedents

snippet = embody('code');

snippet = {
	// ---- static data structures, sync, immediately available ----
	//      arrays of "events" can be iterated as though emitting
	//      or is it better that they're all generators? maintains the event-based NM concept

	source: '', // worth breaking into an object?
	ok: Boolean,
	violations: [], // add to validation if missing: no reassigning globals

	// deal-breakers for parsing, creating and executing
	isJeJ: Boolean,
	formatted: Boolean, // if not isJej

	// metadata if isJej, all undefined if not isJej
	isDeterministic: Boolean, // true if no p/c or M.random calls
	doesPause: Boolean, // true if p/a/c are called
	hasIo: { user, dev }, // what is stored here exactly?

	// --- if is valid JEJ ---
	//		generators of NM events extending a consistent signature

	parse: undefined || {
		tokenize: function* () {},
		parse: function* () {},
	},

	create: undefined || function* () {},

	// lazy, on demand
	execute: undefined || {
		// don't store data about runs as embody properties
		//      data comes from execution calls
		//      this matches the static/dynamic nature of the JEJ NM
		// see plann.excalidaraw.md for these functions' onioning
		//      embody has name-matched wrappers
		//      results can be cached if .deterministic === true
		//      if cached we can re-emit, matching the lib/ tracers' signature
		//      cache should be config-aware (is it worth caching?)
		// execution configs are passed with each call, not passed through embody
		run: async function () {},
		intercept: async function* () {},
		trace: {
			syntax: async function* () {},
			semantics: async function* () {},
		},
	},

	// helper methods wrapped around lib/, useful for lenses
	analyze,
	socratize,
	// ... others?
};
