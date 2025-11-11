import type { ComponentType, SvelteComponent } from 'svelte';
import type { BlogPostMetadata } from '$lib';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module '*.sveltex' {
	export const metadata: BlogPostMetadata;
	const component: ComponentType<SvelteComponent>;
	export default component;
}

export {};
