<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Blog</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-12">
	<h1 class="mb-8 text-4xl font-bold">Blog</h1>

	<div class="space-y-8">
		{#each data.posts as post}
			<article class="border-b border-gray-200 pb-8">
				<a href="/blog/{post.slug}" class="group">
					<h2 class="mb-2 text-2xl font-semibold text-gray-900 group-hover:text-blue-600">
						{post.title}
					</h2>
				</a>

				<div class="mb-3 text-sm text-gray-500">
					<time datetime={post.date}>
						{new Date(post.date).toLocaleDateString('en-US', {
							year: 'numeric',
							month: 'long',
							day: 'numeric'
						})}
					</time>
				</div>

				{#if post.description}
					<p class="mb-3 text-gray-700">{post.description}</p>
				{/if}

				{#if post.tags && post.tags.length > 0}
					<div class="flex flex-wrap gap-2">
						{#each post.tags as tag}
							<span class="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
								{tag}
							</span>
						{/each}
					</div>
				{/if}
			</article>
		{/each}
	</div>
</div>
