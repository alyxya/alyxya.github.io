<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="stylesheet" href="/sveltex/mathjax@3.2.2.chtml.min.css" />
</svelte:head>

{@render children()}
