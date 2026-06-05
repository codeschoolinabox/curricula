/**
 * @file Fills `{{placeholder}}` tokens in explanation templates.
 *
 * @remarks Simple value substitution only — no logic, no nesting.
 * Unmatched placeholders are left as-is so the consumer can see
 * which values were unavailable.
 */

/**
 * Replaces `{{key}}` tokens in a template with values from a context record.
 *
 * @param template - Markdown string with `{{placeholder}}` tokens
 * @param context - Key-value pairs to substitute
 * @returns The template with matched placeholders replaced
 */
function interpolateTemplate(
	template: string,
	context: Readonly<Record<string, string>>,
): string {
	return template.replaceAll(/\{\{(\w+)\}\}/g, (original, key: string) =>
		substituteToken(original, key),
	);

	function substituteToken(original: string, key: string): string {
		const value = context[key];
		return value === undefined ? original : value;
	}
}

export default interpolateTemplate;
