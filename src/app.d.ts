import type { ComponentType, SvelteComponent } from 'svelte';

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
	export const metadata: Record<string, unknown>;
	const component: ComponentType<SvelteComponent>;
	export default component;
}

export {};
