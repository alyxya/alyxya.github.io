<script lang="ts">
	import { formatDate } from '$lib/date';
	import { onMount, tick } from 'svelte';
	import type { ComponentType, SvelteComponent } from 'svelte';

	type PostModule = {
		default: ComponentType<SvelteComponent>;
	};

	const posts = import.meta.glob<PostModule>('/src/posts/**/*.sveltex');

	let { data } = $props();
	const postPath = data.postPath ?? `/src/posts/${data.slug}.sveltex`;

	// Load the specific post component asynchronously
	const postPromise = posts[postPath]?.() || Promise.reject(new Error('Post not found'));

	function getHeaderOffset() {
		if (typeof document === 'undefined') return 0;
		const header = document.querySelector('header');
		return header instanceof HTMLElement ? header.getBoundingClientRect().height : 0;
	}

	function setAnchorOffsetVar() {
		if (typeof document === 'undefined') return 0;
		const offset = getHeaderOffset() + 12;
		document.documentElement.style.setProperty('--anchor-offset', `${offset}px`);
		return offset;
	}

	function scrollToHash(behavior: ScrollBehavior = 'auto') {
		if (typeof window === 'undefined') return;
		const hash = window.location.hash;
		if (!hash) return;
		const id = decodeURIComponent(hash.slice(1));
		const target = document.getElementById(id);
		if (!target) return;
		const offset = setAnchorOffsetVar();
		const top = target.getBoundingClientRect().top + window.scrollY - offset;
		window.scrollTo({ top: Math.max(top, 0), behavior });
	}

	function waitForPostImages() {
		if (typeof document === 'undefined') return Promise.resolve();
		const container = document.querySelector('[data-post-content]');
		if (!(container instanceof HTMLElement)) return Promise.resolve();
		const images = Array.from(container.querySelectorAll('img'));
		if (images.length === 0) return Promise.resolve();
		const waits = images.map((image) => {
			if (!(image instanceof HTMLImageElement) || image.complete) {
				return Promise.resolve();
			}
			return new Promise<void>((resolve) => {
				image.addEventListener('load', () => resolve(), { once: true });
				image.addEventListener('error', () => resolve(), { once: true });
			});
		});
		const timeout = new Promise<void>((resolve) => {
			window.setTimeout(resolve, 1500);
		});
		return Promise.race([Promise.all(waits).then(() => undefined), timeout]);
	}

	onMount(() => {
		const handleHashChange = () => {
			const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
			scrollToHash(prefersReducedMotion ? 'auto' : 'smooth');
		};

		window.addEventListener('hashchange', handleHashChange);

		postPromise
			.then(async () => {
				await tick();
				scrollToHash('auto');
				await waitForPostImages();
				scrollToHash('auto');
			})
			.catch(() => {});

		return () => {
			window.removeEventListener('hashchange', handleHashChange);
		};
	});
</script>

<svelte:head>
	<title>{data.metadata.title}</title>
	{#if data.metadata.description}
		<meta name="description" content={data.metadata.description} />
	{/if}
</svelte:head>

<article class="mx-auto max-w-3xl px-4 py-12">
	<div class="glass-card blog-post-card p-8">
		<!-- Render metadata immediately - no await needed -->
		<header class="mb-8">
			<h1 class="mb-4 text-4xl font-bold text-ocean-900">{data.metadata.title}</h1>

			<div class="mb-4 space-y-1 text-ocean-600">
				<div>
					<time datetime={data.metadata.date}>
						{formatDate(data.metadata.date)}
					</time>
				</div>
				{#if data.metadata.updated}
					<div class="text-sm text-ocean-500">
						Last edited
						<time datetime={data.metadata.updated}>
							{formatDate(data.metadata.updated)}
						</time>
					</div>
				{/if}
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
			<div class="prose prose-lg max-w-none prose-ocean" data-post-content>
				<postModule.default />
			</div>
		{:catch error}
			<p class="text-red-600">Unable to render this post: {error.message}</p>
		{/await}

	</div>
</article>
