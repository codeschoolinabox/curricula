// turns out I was actually drafting the resolve values for the generators in signatures.generated.js

// see phases/ for draft nm outline
// all data structures are fully entwined with precedants

snippet = embody('code');

snippet = {
	// ---- static data structures, sync, immediately available ----
	//      arrays of "events" can be iterated as though emitting
	//      or is it better that they're all generators? maintains the event-based NM concept

	source: '', // worth breaking into an object?
	parse: {
		ok: Boolean,
		error: { name, message, loc, interpretation } || null || undefined,
		tokens: [] || null || undefined,
		ast: {} || null || undefined,
		comments: [] || null || undefined,
		whiteSpace: [] || null || undefined,
		asi: [] || null || undefined, // how/if to represent this?
	},
	// null if parsing fails
	meta: null || {
		isJeJ: Boolean,
		formatted: Boolean,
		ok: Boolean,
		violations: [], // add to validation: no reassigning globals (is it already?)
		deterministic: Boolean, // true if no p/c or M.random calls
		pauses: Boolean, // true if p/a/c are called
		io: { user, dev }, // what is stored here exactly?
	},

	// ---- event-emitting generator ----

	// null if parsing or validation fail
	creation: null || {
		ok: Boolean,
		error: { name, message, loc, interpretation } || null || undefined,
		// what is this type?  how does it entwine with .parse data?
		global: {} || null || undefined,
		script: {} || null || undefined, // is this really created in creation phase?
		env: [global, script] || null || undefined,
	},

	// ---- event-emitting async generators ----

	// lazy, on demand
	// null if parsing or validation or creation fail
	execution: null || {
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
