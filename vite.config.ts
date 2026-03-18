import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	build: {
		chunkSizeWarningLimit: 700
	},
	server: {
		host: '127.0.0.1',
		watch: {
			ignored: ['**/build/**', '**/.svelte-kit/output/**']
		}
	}
});
