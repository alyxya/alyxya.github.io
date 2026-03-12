<script lang="ts">
	import { formatDate } from '$lib/date';
	import { onMount, tick } from 'svelte';

	let { data } = $props();

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

	onMount(async () => {
		const handleHashChange = () => {
			const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
			scrollToHash(prefersReducedMotion ? 'auto' : 'smooth');
		};

		window.addEventListener('hashchange', handleHashChange);

		await tick();
		scrollToHash('auto');
		await waitForPostImages();
		scrollToHash('auto');

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

<article class="mx-auto max-w-4xl px-4 py-12">
	<div class="panel-card blog-post-card p-8">
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

		<div class="prose prose-lg max-w-none prose-ocean" data-post-content>
			<data.component />
		</div>

	</div>
</article>
