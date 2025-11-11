import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { sveltex } from '@nvl/sveltex';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.sveltex'],
	preprocess: [
		vitePreprocess(),
		await sveltex({
			markdownBackend: 'unified',
			codeBackend: 'shiki',
			mathBackend: 'mathjax'
		}, {
			// Options
		})
	],
	kit: {
		adapter: adapter()
	}
};

export default config;
