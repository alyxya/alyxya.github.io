<script lang="ts">
	import { formatDate } from '$lib/date';
	let { data } = $props();
</script>

<svelte:head>
	<title>Blog</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-12">
	<div class="panel-card divide-y divide-ocean-200/60 p-8">
		<h1 class="pb-5 text-4xl font-bold text-ocean-900">Blog</h1>

		{#each data.posts as post (post.slug)}
			<a href="/blog/{post.slug}" class="group block py-5 last:pb-0">
				<article>
					<div class="mb-1.5 flex items-baseline justify-between gap-4">
						<h2 class="text-xl font-semibold text-ocean-900 group-hover:text-ocean-600">
							{post.title}
						</h2>
						<time datetime={post.date} class="shrink-0 text-sm text-ocean-500">
							{formatDate(post.date)}
						</time>
					</div>

					{#if post.description}
						<p class="mb-2 text-ocean-700">{post.description}</p>
					{/if}

					{#if post.tags && post.tags.length > 0}
						<div class="flex flex-wrap gap-1.5">
							{#each post.tags as tag (tag)}
								<span class="rounded-full bg-ocean-100 px-2.5 py-0.5 text-sm text-ocean-700 ring-1 ring-ocean-200 group-hover:bg-ocean-200 group-hover:ring-ocean-300">
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
