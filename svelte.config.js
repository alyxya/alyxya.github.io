import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import sveltexPreprocessor from './sveltex.config.js';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.sveltex'],
	preprocess: [vitePreprocess(), sveltexPreprocessor],
	onwarn: (warning, handler) => {
		if (warning.code === 'a11y_no_noninteractive_tabindex') return;
		handler(warning);
	},
	kit: {
		adapter: adapter()
	}
};

export default config;
