const EMBODY_SCENARIOS = Object.freeze([
	'OK',
	'FAIL_AT_TOKENIZE',
	'FAIL_AT_PARSE',
	'VALIDATION_FAIL',
	'FAIL_AT_CREATE',
	'NON_DETERMINISTIC',
	'PAUSES',
	'EVAL_ERROR',
	'EVAL_TIMEOUT',
	'EVAL_LIMIT',
	'EVAL_CANCELLED',
] as const);

export type EmbodyScenario = (typeof EMBODY_SCENARIOS)[number];

export default EMBODY_SCENARIOS;
