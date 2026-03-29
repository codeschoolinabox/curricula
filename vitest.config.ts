import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			'@utils': path.resolve(__dirname, 'src/lib/utils'),
		},
	},
	test: {
		include: ['src/lib/**/*.test.ts'],
		environment: 'node',
	},
});
