/** Converts a kebab-case string to Title Case: `while-loops` → `"While Loops"`. */
export default function toTitleCase(s: string): string {
	return s
		.split('-')
		.map((seg) => (seg === '' ? seg : seg[0].toUpperCase() + seg.slice(1)))
		.join(' ');
}
