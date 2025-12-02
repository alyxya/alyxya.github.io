<script lang="ts">
	import type { ComponentType, SvelteComponent } from 'svelte';

	type PostModule = {
		default: ComponentType<SvelteComponent>;
	};

	const posts = import.meta.glob<PostModule>('/src/posts/*.sveltex');

	let { data } = $props();
	const path = `/src/posts/${data.slug}.sveltex`;

	// Load the specific post component asynchronously
	const postPromise = posts[path]?.() || Promise.reject(new Error('Post not found'));
</script>

<svelte:head>
	<title>{data.metadata.title}</title>
	{#if data.metadata.description}
		<meta name="description" content={data.metadata.description} />
	{/if}
</svelte:head>

<article class="mx-auto max-w-3xl px-4 py-12">
	<div class="glass-card p-8">
		<!-- Render metadata immediately - no await needed -->
		<header class="mb-8">
			<h1 class="mb-4 text-4xl font-bold text-ocean-900">{data.metadata.title}</h1>

			<div class="mb-4 text-ocean-600">
				<time datetime={data.metadata.date}>
					{new Date(data.metadata.date).toLocaleDateString('en-US', {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}
				</time>
			</div>

			{#if data.metadata.tags && data.metadata.tags.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each data.metadata.tags as tag (tag)}
						<span class="rounded-full bg-ocean-100 px-3 py-1 text-sm text-ocean-700 ring-1 ring-ocean-200">
							{tag}
						</span>
					{/each}
				</div>
			{/if}
		</header>

		<!-- Load post content asynchronously without blocking initial render -->
		{#await postPromise}
			<div class="space-y-4">
				<div class="h-4 bg-ocean-200 rounded w-3/4"></div>
				<div class="h-4 bg-ocean-200 rounded"></div>
				<div class="h-4 bg-ocean-200 rounded w-5/6"></div>
			</div>
		{:then postModule}
			<div class="prose prose-lg max-w-none prose-ocean">
				<postModule.default />
			</div>
		{:catch error}
			<p class="text-red-600">Unable to render this post: {error.message}</p>
		{/await}

	</div>
</article>
