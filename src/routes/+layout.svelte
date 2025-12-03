<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';

	let { children } = $props();
</script>

{#if page.url.pathname !== '/'}
	<header class="sticky top-0 z-50 backdrop-blur bg-white/60 border-b border-ocean-200">
		<nav class="mx-auto max-w-3xl px-4 py-2">
			<a href="/blog" class="font-semibold text-ocean-900 hover:text-ocean-700">alyxya's blog</a>
		</nav>
	</header>
{/if}

{@render children()}
