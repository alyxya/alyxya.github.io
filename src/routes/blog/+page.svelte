<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Blog</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-12">
	<div class="glass-card mb-8 p-6">
		<h1 class="text-4xl font-bold text-ocean-900">Blog</h1>
	</div>

	<div class="space-y-6">
		{#each data.posts as post (post.slug)}
			<a href="/blog/{post.slug}" class="group block">
				<article class="glass-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
					<h2 class="mb-2 text-2xl font-semibold text-ocean-900 transition-colors group-hover:text-ocean-600">
						{post.title}
					</h2>

					<div class="mb-3 text-sm text-ocean-500">
						<time datetime={post.date}>
							{new Date(post.date).toLocaleDateString('en-US', {
								year: 'numeric',
								month: 'long',
								day: 'numeric'
							})}
						</time>
					</div>

					{#if post.description}
						<p class="mb-3 text-ocean-700">{post.description}</p>
					{/if}

					{#if post.tags && post.tags.length > 0}
						<div class="flex flex-wrap gap-2">
							{#each post.tags as tag (tag)}
								<span class="rounded-full bg-ocean-100 px-3 py-1 text-sm text-ocean-700 ring-1 ring-ocean-200 transition-all hover:bg-ocean-200 hover:ring-ocean-300">
									{tag}
								</span>
							{/each}
						</div>
					{/if}
				</article>
			</a>
		{/each}
	</div>
</div>
