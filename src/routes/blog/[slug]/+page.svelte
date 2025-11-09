<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.metadata.title}</title>
	{#if data.metadata.description}
		<meta name="description" content={data.metadata.description} />
	{/if}
</svelte:head>

<article class="mx-auto max-w-3xl px-4 py-12">
	<header class="mb-8">
		<h1 class="mb-4 text-4xl font-bold">{data.metadata.title}</h1>

		<div class="mb-4 text-gray-600">
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
				{#each data.metadata.tags as tag}
					<span class="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
						{tag}
					</span>
				{/each}
			</div>
		{/if}
	</header>

	<div class="prose prose-lg prose-slate max-w-none">
		<data.content />
	</div>

	<div class="mt-12 border-t border-gray-200 pt-8">
		<a href="/blog" class="text-blue-600 hover:text-blue-800">← Back to all posts</a>
	</div>
</article>
